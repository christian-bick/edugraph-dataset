import {createHash} from 'node:crypto';
import {existsSync, readFileSync} from 'node:fs';
import {basename, relative, resolve} from 'node:path';
import {
    MatchTuple,
    SampleSplit,
    SPLIT_DIRS
} from './generation.ts';
import type {GeneratorModelDescriptor, ViewModelDescriptor} from './model-catalog.ts';
import {
    buildCompatibleModulePairIndex,
    buildDependencyMatchingIndex,
    generatorCapabilityInputHash,
    generatorCapabilityNodeId,
    matchTargets,
    matchingPolicyInputHash,
    matchingPolicyNodeId,
    matchTupleNodeId,
    modulePairKey,
    modulePairNodeId,
    targetCapabilityInputHash,
    targetCapabilityNodeId,
    viewCapabilityInputHash,
    viewCapabilityNodeId,
    type CompatibleModulePairIndex
} from './matching.ts';
import {CompetencyTarget} from '../types/ml-engine.ts';
import {partOf, type CompetencyDescriptor} from 'edugraph-ts';
import {currentRendererEnvironment} from './render-environment.ts';
import {
    SourceContentIndex,
    digestFile,
    digestIdentity,
    radixSortUtf8,
    type SourceContentIndexStats
} from './content-identity.ts';
import {
    DEPENDENCY_PLANNER_EPOCH,
    createDependencyGraphSnapshot,
    explainAffectedNode,
    planDependencyDelta,
    type DependencyDeltaPlan,
    type DependencyGraphSnapshot,
    type DependencyNode
} from './dependency-planner.ts';
import {readDatasetSnapshot, type DatasetSnapshot} from './dataset-store.ts';
import {
    OntologySemanticIndex,
    buildOntologySemanticSnapshot,
    type OntologySemanticSnapshot
} from './external-semantics.ts';
import {resolveOntologyProvenance} from './coverage-identity.ts';
import {createVqaValidationContextResolver} from './vqa-cache.ts';
import {
    validationPolicyInputHash,
    validationPolicySourcePaths
} from './vqa-policy.ts';
import type {WorkCounters} from './work-counters.ts';
import {
    captureDevelopmentInputObservation,
    type DevelopmentInputObservation
} from './development-observation.ts';
import {ModelSourceIndex} from './model-source-index.ts';

export const DATASET_MANIFEST_SCHEMA_VERSION = 8;
const GENERATION_PIPELINE_VERSION = 'unified-dependency-graph-v1';

export interface DatasetManifestEntry {
    generator: string;
    view: string;
    renderer_environment: string;
    input_hash: string;
    content_hash: string;
    sample_counts: Record<SampleSplit, number>;
    generated_splits: SampleSplit[];
    /** Pair, shard, image, and VQA nodes owned by this execution unit. */
    execution_nodes: string[];
    /** Nodes whose invalidation requires regenerating this pair's pixels. */
    render_nodes: string[];
    /** Nodes whose invalidation requires semantic validation but not rendering. */
    validation_nodes: string[];
}

export type DatasetExecutionPlan = Omit<DependencyDeltaPlan, 'reusable_outputs'>;

export interface DatasetManifest {
    schema_version: number;
    planner_epoch: number;
    complete: true;
    spec: string;
    ontology_dependency: string;
    ontology_provenance_hash?: string;
    generated_at: string;
    /** Non-authoritative Git-assisted shortcut for exact development no-ops. */
    development_observation?: DevelopmentInputObservation;
    dependency_graph: DependencyGraphSnapshot;
    last_execution: DatasetExecutionPlan;
    entries: Record<string, DatasetManifestEntry>;
}

export interface DatasetManifestBuild {
    entries: Record<string, DatasetManifestEntry>;
    dependency_graph: DependencyGraphSnapshot;
    development_observation?: DevelopmentInputObservation | null;
    source_stats: Readonly<SourceContentIndexStats>;
    ontology_semantics: {
        ontology_entities: number;
        ontology_relations: number;
        dependency?: string;
        provenance_hash?: string;
    };
}

export interface DatasetObservedSourcePlan {
    graph: DependencyGraphSnapshot;
    plan: DependencyDeltaPlan;
    pairKeys: string[];
    candidateNodes: string[];
}

/** Returns the graph-owned VQA cache identity for one structural sample. */
export function dependencyGraphVqaCacheKey(
    graph: DependencyGraphSnapshot,
    sampleKey: string
): string | null {
    const node = graph.nodes[nodeId('vqa', sampleKey)];
    return node?.kind === 'vqa-record' ? node.input_hash : null;
}

export interface ManifestUpdateScope {
    fullDataset: boolean;
    generatorIds: string[];
    viewIds?: string[];
    pairKeys?: string[];
}

interface DatasetManifestRow {
    file_name: string;
    sample_key: string;
    generator: string;
    view: string;
    target_id?: string;
    content_fingerprint?: string;
    task_fingerprint?: string;
    tags?: string[];
    target_associations?: Array<{spec: string; target_id: string}>;
    _split: SampleSplit;
}

const SOURCE_EXTENSIONS = new Set([
    '.cjs', '.css', '.html', '.js', '.json', '.jsx', '.md', '.mjs', '.ts', '.tsx',
    '.jpeg', '.jpg', '.png', '.svg', '.webp'
]);

function extension(path: string): string {
    const match = path.match(/(\.[^.\\/]+)$/);
    return match?.[1] ?? '';
}

function includeRenderSource(path: string): boolean {
    return SOURCE_EXTENSIONS.has(extension(path))
        && !path.endsWith('.test.ts')
        && !path.endsWith('.test.tsx')
        && basename(path) !== 'checklist.md';
}

function hash(value: string): string {
    return createHash('sha256').update(value).digest('hex').slice(0, 16);
}

function nodeId(kind: string, identity: string): string {
    return `${kind}:${identity}`;
}

function ontologyName(label: string): string {
    const prefix = 'http://edugraph.io/edu/';
    return label.startsWith(prefix) ? label.slice(prefix.length) : label;
}

function ontologyIri(label: string): string {
    return label.startsWith('http://edugraph.io/edu/')
        ? label
        : `http://edugraph.io/edu/${label}`;
}

export function datasetOntologyDependency(projectRoot: string): string {
    const packageJson = JSON.parse(readFileSync(resolve(projectRoot, 'package.json'), 'utf-8'));
    return packageJson.dependencies?.['edugraph-ts'] ?? 'unknown';
}

export function datasetOntologyProvenanceHash(projectRoot: string): string {
    return digestIdentity(resolveOntologyProvenance(projectRoot));
}

let verifiedOntologySemantics: {key: string; snapshot: OntologySemanticSnapshot} | null = null;

function currentOntologySemantics(projectRoot: string): OntologySemanticSnapshot {
    const provenance = resolveOntologyProvenance(projectRoot);
    const key = `${provenance.resolved}:${provenance.integrity}`;
    if (verifiedOntologySemantics?.key === key) return verifiedOntologySemantics.snapshot;
    const snapshot = buildOntologySemanticSnapshot({provenance});
    verifiedOntologySemantics = {key, snapshot};
    return snapshot;
}

function readDatasetRows(snapshot: DatasetSnapshot): DatasetManifestRow[] {
    const rows: DatasetManifestRow[] = [];
    for (const split of Object.keys(SPLIT_DIRS) as SampleSplit[]) {
        rows.push(...snapshot.rows(split)
            .map(row => ({...row, _split: split}) as DatasetManifestRow));
    }
    return rows;
}

function addNode(nodes: Map<string, DependencyNode>, node: DependencyNode): void {
    const existing = nodes.get(node.id);
    if (existing && JSON.stringify(existing) !== JSON.stringify(node)) {
        throw new Error(`Conflicting definitions for dependency node ${node.id}.`);
    }
    nodes.set(node.id, node);
}

function sourceDependencies(
    nodes: Map<string, DependencyNode>,
    sourceIndex: SourceContentIndex,
    paths: readonly string[],
    include = includeRenderSource
): {ids: string[]; hash: string} {
    const identities = sourceIndex.identities(paths, {include});
    const ids: string[] = [];
    for (const identity of identities) {
        const id = nodeId('source', identity.path);
        ids.push(id);
        addNode(nodes, {
            id,
            kind: 'source-file',
            input_hash: identity.sha256,
            dependencies: [],
            output: {content_hash: identity.sha256, bytes: identity.bytes}
        });
    }
    return {ids, hash: sourceIndex.hash(paths, {include})};
}

function targetIdsOf(row: DatasetManifestRow): string[] {
    return radixSortUtf8([...new Set([
        ...(row.target_id ? [row.target_id] : []),
        ...(row.target_associations ?? []).map(association => association.target_id)
    ])]);
}

/**
 * Patches recorded authored source bytes without reconstructing catalogs. It
 * is safe only for files already owned by the persisted model graph; semantic
 * capability changes are checked after loading the selected modules.
 */
export function planObservedDatasetSourceDelta(options: {
    projectRoot: string;
    previous: DatasetManifest;
    changedFiles: readonly string[];
    candidateNodes: readonly string[];
}): DatasetObservedSourcePlan | null {
    if (options.changedFiles.length === 0 || options.candidateNodes.length === 0) return null;
    const nodes = new Map(Object.entries(options.previous.dependency_graph.nodes));
    let patched = 0;
    for (const rawPath of options.changedFiles) {
        const path = rawPath.replaceAll('\\', '/');
        const id = nodeId('source', path);
        const previous = nodes.get(id);
        // Mixed owned/unowned deltas must take the complete planner path; a
        // partial patch may never conceal a simultaneous target/structure edit.
        if (!previous || previous.kind !== 'source-file') return null;
        const absolutePath = resolve(options.projectRoot, path);
        const digest = existsSync(absolutePath)
            ? digestFile(absolutePath)
            : {sha256: digestIdentity({missing: path}), bytes: 0};
        nodes.set(id, {
            ...previous,
            input_hash: digest.sha256,
            output: {content_hash: digest.sha256, bytes: digest.bytes}
        });
        patched++;
    }
    if (patched === 0 || patched !== options.changedFiles.length) return null;
    const graph = createDependencyGraphSnapshot(
        [...nodes.values()],
        DEPENDENCY_PLANNER_EPOCH,
        options.previous.dependency_graph.matching_index
    );
    const plan = planDependencyDelta(options.previous.dependency_graph, graph);
    const build: DatasetManifestBuild = {
        entries: options.previous.entries,
        dependency_graph: graph,
        source_stats: {directories_read: 0, files_read: patched, bytes_read: 0},
        ontology_semantics: {
            ontology_entities: 0,
            ontology_relations: 0,
            dependency: options.previous.ontology_dependency,
            provenance_hash: options.previous.ontology_provenance_hash
        }
    };
    return {
        graph,
        plan,
        pairKeys: affectedDatasetPairKeys(plan, build, options.previous),
        candidateNodes: radixSortUtf8([...new Set(options.candidateNodes)])
    };
}

/**
 * Replaces only selected pair subgraphs after an observed authored-source
 * delta. Matching postings remain authoritative because callers admit this
 * path only after selected capability identities compare equal.
 */
export function mergeObservedDatasetBuild(options: {
    projectRoot: string;
    specName: string;
    previous: DatasetManifest;
    partial: DatasetManifestBuild;
    pairKeys: readonly string[];
    sourceIndex?: SourceContentIndex;
}): DatasetManifestBuild {
    const sourceIndex = options.sourceIndex ?? new SourceContentIndex(options.projectRoot);
    const selected = new Set(options.pairKeys);
    const oldOwned = new Set<string>();
    const oldImages = new Set<string>();
    for (const key of selected) {
        for (const id of options.previous.entries[key]?.execution_nodes ?? []) {
            oldOwned.add(id);
            if (id.startsWith('image:')) oldImages.add(id);
        }
    }
    const nodes = new Map(Object.entries(options.previous.dependency_graph.nodes));
    for (const id of oldOwned) nodes.delete(id);

    const partialSpecial: DependencyNode[] = [];
    for (const node of Object.values(options.partial.dependency_graph.nodes)) {
        if (node.kind === 'asset-index-record' || node.kind === 'coverage-record') {
            partialSpecial.push(node);
            continue;
        }
        nodes.set(node.id, node);
    }
    for (const node of partialSpecial) {
        const previous = options.previous.dependency_graph.nodes[node.id];
        const retainedDependencies = previous?.dependencies.filter(dependency =>
            node.kind === 'coverage-record' || !oldImages.has(dependency)) ?? [];
        nodes.set(node.id, {
            ...node,
            dependencies: radixSortUtf8([...new Set([...retainedDependencies, ...node.dependencies])])
        });
    }

    const referenced = new Set<string>();
    for (const node of nodes.values()) {
        for (const dependency of node.dependencies) referenced.add(dependency);
    }
    for (const [id, node] of nodes) {
        if (node.kind === 'source-file' && !referenced.has(id)) nodes.delete(id);
    }

    const graph = createDependencyGraphSnapshot(
        [...nodes.values()],
        DEPENDENCY_PLANNER_EPOCH,
        options.previous.dependency_graph.matching_index
    );
    const entries = {...options.previous.entries};
    for (const key of selected) {
        const entry = options.partial.entries[key];
        if (entry) entries[key] = entry;
        else delete entries[key];
    }
    return {
        entries,
        dependency_graph: graph,
        development_observation: captureDevelopmentInputObservation({
            projectRoot: options.projectRoot,
            specName: options.specName,
            graph,
            sourceIndex,
            rendererEnvironment: currentRendererEnvironment(),
            entryFilesByNode: options.previous.development_observation?.entry_files_by_node
        }),
        source_stats: sourceIndex.stats(),
        ontology_semantics: options.partial.ontology_semantics
    };
}

export function buildDatasetManifest(options: {
    projectRoot: string;
    datasetDir: string;
    specName: string;
    targets: CompetencyTarget[];
    generators: GeneratorModelDescriptor[];
    views: ViewModelDescriptor[];
    generatedSplits: SampleSplit[];
    rendererEnvironment?: string;
    tuples?: readonly MatchTuple[];
    pairIndex?: CompatibleModulePairIndex;
    sourceIndex?: SourceContentIndex;
    reuseImageIdentityFrom?: DependencyGraphSnapshot;
    counters?: WorkCounters;
    datasetSnapshot?: DatasetSnapshot;
    semanticSnapshots?: {
        ontology?: OntologySemanticSnapshot | null;
    };
}): DatasetManifestBuild {
    const {
        projectRoot,
        datasetDir,
        specName,
        targets,
        generators,
        views,
        generatedSplits,
        rendererEnvironment = currentRendererEnvironment(),
        tuples: preparedTuples,
        pairIndex: preparedPairIndex,
        sourceIndex = new SourceContentIndex(projectRoot),
        reuseImageIdentityFrom,
        counters,
        datasetSnapshot = readDatasetSnapshot(datasetDir),
        semanticSnapshots
    } = options;
    const pairIndex = preparedPairIndex ?? buildCompatibleModulePairIndex(generators, views);
    const tuples = preparedTuples ?? matchTargets(targets, generators, views, {pairIndex}).tuples;
    const ontology = datasetOntologyDependency(projectRoot);
    const ontologySemantics = semanticSnapshots
        ? {
            ontology: semanticSnapshots.ontology ?? null
        }
        : {
            ontology: currentOntologySemantics(projectRoot)
        };
    const ontologyIndex = ontologySemantics.ontology
        ? new OntologySemanticIndex(ontologySemantics.ontology)
        : null;
    const modelSourceIndex = new ModelSourceIndex(projectRoot);
    const nodes = new Map<string, DependencyNode>();
    const rows = readDatasetRows(datasetSnapshot);
    const rowsByPair = new Map<string, DatasetManifestRow[]>();
    for (const row of rows) {
        const key = modulePairKey(row.generator, row.view);
        const group = rowsByPair.get(key);
        if (group) group.push(row);
        else rowsByPair.set(key, [row]);
    }

    const generatorById = new Map(generators.map(entry => [entry.generatorId, entry]));
    const viewById = new Map(views.map(entry => [entry.viewId, entry]));
    const targetsByPair = new Map<string, CompetencyTarget[]>();
    const pairsByTarget = new Map<string, string[]>();
    for (const tuple of tuples) {
        const key = modulePairKey(tuple.generatorId, tuple.viewId);
        const pairTargets = targetsByPair.get(key);
        if (pairTargets) pairTargets.push(tuple.target);
        else targetsByPair.set(key, [tuple.target]);
        const targetPairs = pairsByTarget.get(tuple.target.id);
        if (targetPairs) targetPairs.push(key);
        else pairsByTarget.set(tuple.target.id, [key]);
    }

    const targetNodeByTarget = new Map<string, string>();
    const targetCapabilityNodeByTarget = new Map<string, string>();
    const ontologyNodeByName = new Map<string, string>();
    const ontologyDefinitionNodeByName = new Map<string, string>();
    const ontologyNode = (rawLabel: string): string => {
        const name = ontologyName(rawLabel);
        const existing = ontologyNodeByName.get(name);
        if (existing) return existing;
        const id = nodeId('ontology', name);
        ontologyNodeByName.set(name, id);
        const semantic = ontologySemantics.ontology?.entities[ontologyIri(rawLabel)];
        addNode(nodes, {
            id,
            kind: 'ontology-entity',
            input_hash: semantic?.identity_hash ?? digestIdentity({ontology, entity: name}),
            dependencies: []
        });
        return id;
    };
    const ontologyDefinitionNode = (rawLabel: string): string => {
        const name = ontologyName(rawLabel);
        const existing = ontologyDefinitionNodeByName.get(name);
        if (existing) return existing;
        const entityId = ontologyNode(rawLabel);
        const id = nodeId('ontology-definition', name);
        ontologyDefinitionNodeByName.set(name, id);
        const semantic = ontologySemantics.ontology?.entities[ontologyIri(rawLabel)];
        addNode(nodes, {
            id,
            kind: 'ontology-entity',
            input_hash: semantic?.definition_hash ?? digestIdentity({ontology, definition: name}),
            dependencies: [entityId]
        });
        return id;
    };
    const ontologyDependencies = (labels: readonly string[], includeDefinitions = false): string[] => {
        if (!ontologyIndex || !ontologySemantics.ontology) {
            const dependencies: string[] = [];
            const visited = new Set<string>();
            const queue = [...labels];
            let cursor = 0;
            while (cursor < queue.length) {
                const label = queue[cursor++];
                if (visited.has(label)) continue;
                visited.add(label);
                const entityId = ontologyNode(label);
                dependencies.push(entityId);
                try {
                    for (const parent of partOf(ontologyIri(label) as CompetencyDescriptor) ?? []) {
                        const parentId = ontologyNode(parent);
                        const relationId = nodeId(
                            'ontology-relation',
                            `partOf:${ontologyName(label)}->${ontologyName(parent)}`
                        );
                        addNode(nodes, {
                            id: relationId,
                            kind: 'ontology-relation',
                            input_hash: digestIdentity({ontology, relation: 'partOf', source: label, target: parent}),
                            dependencies: [entityId, parentId]
                        });
                        dependencies.push(relationId);
                        if (!visited.has(parent)) queue.push(parent);
                    }
                } catch {
                    // Authored unknown labels remain explicit entity dependencies.
                }
            }
            if (includeDefinitions) dependencies.push(...labels.map(ontologyDefinitionNode));
            return radixSortUtf8([...new Set(dependencies)]);
        }
        const closure = ontologyIndex.closure(labels);
        const dependencies = closure.entities.map(ontologyNode);
        for (const key of closure.relations) {
            const relation = ontologySemantics.ontology.relations[key];
            if (!relation) continue;
            const sourceId = ontologyNode(relation.source);
            const targetId = ontologyNode(relation.target);
            const sourceName = ontologyName(relation.source);
            const targetName = ontologyName(relation.target);
            const id = nodeId('ontology-relation', `${relation.type}:${sourceName}->${targetName}`);
            addNode(nodes, {
                id,
                kind: 'ontology-relation',
                input_hash: relation.input_hash,
                dependencies: [sourceId, targetId]
            });
            dependencies.push(id);
        }
        if (includeDefinitions) dependencies.push(...labels.map(ontologyDefinitionNode));
        return radixSortUtf8([...new Set(dependencies)]);
    };
    for (const target of targets) {
        const capabilityId = targetCapabilityNodeId(specName, target.id);
        const targetId = nodeId('target', `${specName}:${target.id}`);
        targetCapabilityNodeByTarget.set(target.id, capabilityId);
        targetNodeByTarget.set(target.id, targetId);
        addNode(nodes, {
            id: capabilityId,
            kind: 'target-capability',
            input_hash: targetCapabilityInputHash(target),
            dependencies: ontologyDependencies(target.labels)
        });
        addNode(nodes, {
            id: targetId,
            kind: 'competency-target',
            input_hash: digestIdentity({id: target.id, explanation: target.explanation ?? null}),
            dependencies: [capabilityId]
        });
    }

    addNode(nodes, {
        id: matchingPolicyNodeId(),
        kind: 'matching-policy',
        input_hash: matchingPolicyInputHash(),
        dependencies: []
    });

    const validationPolicySources = sourceDependencies(
        nodes,
        sourceIndex,
        validationPolicySourcePaths(projectRoot)
    );
    const validationPolicyHash = validationPolicyInputHash(projectRoot, sourceIndex);
    const validationPolicyId = nodeId('validation-policy', 'vqa');
    addNode(nodes, {
        id: validationPolicyId,
        kind: 'validation-policy',
        input_hash: validationPolicyHash,
        dependencies: validationPolicySources.ids
    });

    const generatorHashes = new Map<string, string>();
    const generatorNodeIds = new Map<string, string>();
    const generatorCapabilityNodeIds = new Map<string, string>();
    for (const generator of generators) {
        const sources = sourceDependencies(nodes, sourceIndex, modelSourceIndex.dependencies([
            resolve(generator.module.absolutePath, 'generator.ts'),
            resolve(generator.module.absolutePath, 'spec.ts')
        ]));
        const id = nodeId('generator', generator.generatorId);
        const capabilityId = generatorCapabilityNodeId(generator.generatorId);
        generatorHashes.set(generator.generatorId, sources.hash);
        generatorNodeIds.set(generator.generatorId, id);
        generatorCapabilityNodeIds.set(generator.generatorId, capabilityId);
        addNode(nodes, {
            id: capabilityId,
            kind: 'generator-capability',
            input_hash: generatorCapabilityInputHash(generator),
            dependencies: ontologyDependencies(generator.labels)
        });
        addNode(nodes, {
            id,
            kind: 'generator-module',
            input_hash: digestIdentity({id: generator.generatorId}),
            dependencies: [
                capabilityId,
                ...sources.ids
            ]
        });
    }
    const viewHashes = new Map<string, string>();
    const viewNodeIds = new Map<string, string>();
    const viewCapabilityNodeIds = new Map<string, string>();
    const checklistDependencies = new Map<string, {ids: string[]; paths: string[]}>();
    for (const view of views) {
        const sources = sourceDependencies(nodes, sourceIndex, modelSourceIndex.dependencies([
            resolve(view.module.absolutePath, 'view.tsx'),
            resolve(view.module.absolutePath, 'spec.ts')
        ]));
        const id = nodeId('view', view.viewId);
        const capabilityId = viewCapabilityNodeId(view.viewId);
        viewHashes.set(view.viewId, sources.hash);
        viewNodeIds.set(view.viewId, id);
        viewCapabilityNodeIds.set(view.viewId, capabilityId);
        addNode(nodes, {
            id: capabilityId,
            kind: 'view-capability',
            input_hash: viewCapabilityInputHash(view),
            dependencies: [
                ...ontologyDependencies([
                    ...view.supportedLabels,
                    ...(view.requiredLabels ?? []),
                    ...(view.rejectedLabels ?? [])
                ])
            ]
        });
        addNode(nodes, {
            id,
            kind: 'view-module',
            input_hash: digestIdentity({id: view.viewId}),
            dependencies: [capabilityId, ...sources.ids]
        });
        const checklistPaths = [
            resolve(projectRoot, 'src', 'visuals', 'views', 'checklist.md'),
            resolve(view.module.absolutePath, 'checklist.md')
        ];
        checklistDependencies.set(view.viewId, {
            ids: sourceDependencies(
                nodes,
                sourceIndex,
                checklistPaths,
                path => basename(path) === 'checklist.md'
            ).ids,
            paths: checklistPaths
        });
    }

    const modulePairNodeIds = new Map<string, string>();
    for (const pair of pairIndex.orderedPairs) {
        const generatorId = pair.generator.generatorId;
        const viewId = pair.view.viewId;
        const key = modulePairKey(generatorId, viewId);
        const id = modulePairNodeId(generatorId, viewId);
        modulePairNodeIds.set(key, id);
        addNode(nodes, {
            id,
            kind: 'module-pair',
            input_hash: digestIdentity({pair: key}),
            dependencies: [
                matchingPolicyNodeId(),
                generatorCapabilityNodeIds.get(generatorId)!,
                viewCapabilityNodeIds.get(viewId)!
            ]
        });
    }

    const matchNodeByTargetAndPair = new Map<string, string>();
    for (const tuple of tuples) {
        const key = modulePairKey(tuple.generatorId, tuple.viewId);
        const modulePairId = modulePairNodeIds.get(key);
        const targetCapabilityId = targetCapabilityNodeByTarget.get(tuple.target.id);
        if (!modulePairId || !targetCapabilityId) continue;
        const id = matchTupleNodeId(
            specName,
            tuple.target.id,
            tuple.generatorId,
            tuple.viewId
        );
        matchNodeByTargetAndPair.set(`${tuple.target.id}\u0000${key}`, id);
        addNode(nodes, {
            id,
            kind: 'match-tuple',
            input_hash: digestIdentity({matched: true}),
            dependencies: [targetCapabilityId, modulePairId]
        });
    }

    const entries: Record<string, DatasetManifestEntry> = {};
    const executionNodesByPair = new Map<string, Set<string>>();
    const renderNodesByPair = new Map<string, Set<string>>();
    const validationNodesByPair = new Map<string, Set<string>>();
    const imageNodesByTarget = new Map<string, string[]>();
    const vqaContextResolver = createVqaValidationContextResolver(
        counters,
        validationPolicyHash
    );
    for (const key of radixSortUtf8([...targetsByPair.keys()])) {
        const [generatorId, viewId] = key.split('#');
        const generator = generatorById.get(generatorId);
        const view = viewById.get(viewId);
        if (!generator || !view) continue;
        const pairTargets = targetsByPair.get(key)!;
        const pairNodeId = nodeId('pair', key);
        const pairMatchNodeIds = radixSortUtf8(pairTargets
            .map(target => matchNodeByTargetAndPair.get(`${target.id}\u0000${key}`))
            .filter((id): id is string => Boolean(id)));
        addNode(nodes, {
            id: pairNodeId,
            kind: 'generation-pair',
            input_hash: digestIdentity({
                pipeline: GENERATION_PIPELINE_VERSION,
                renderer: rendererEnvironment,
                pair: key
            }),
            dependencies: [
                generatorNodeIds.get(generatorId)!,
                viewNodeIds.get(viewId)!,
                ...pairMatchNodeIds
            ]
        });
        const executionNodes = new Set([pairNodeId]);
        executionNodesByPair.set(key, executionNodes);
        renderNodesByPair.set(key, new Set([pairNodeId]));
        validationNodesByPair.set(key, new Set());
        const pairRows = rowsByPair.get(key) ?? [];
        const sampleCounts: Record<SampleSplit, number> = {train: 0, val: 0};
        for (const row of pairRows) sampleCounts[row._split]++;
        const contentSignature = pairRows.map(row => ({
            sample_key: row.sample_key,
            content_fingerprint: row.content_fingerprint,
            task_fingerprint: row.task_fingerprint
        }));
        const targetSignature = pairTargets.map(target => ({
            id: target.id,
            labels: radixSortUtf8([...target.labels])
        }));
        const pairSplits = radixSortUtf8([...new Set(pairRows.map(row => row._split))]) as SampleSplit[];
        entries[key] = {
            generator: generatorId,
            view: viewId,
            renderer_environment: rendererEnvironment,
            input_hash: hash(JSON.stringify({
                pipeline: GENERATION_PIPELINE_VERSION,
                renderer: rendererEnvironment,
                generator: generatorHashes.get(generatorId),
                view: viewHashes.get(viewId),
                targets: targetSignature
            })),
            content_hash: hash(JSON.stringify(contentSignature)),
            sample_counts: sampleCounts,
            generated_splits: pairSplits.length > 0 ? pairSplits : [...generatedSplits],
            execution_nodes: [],
            render_nodes: [],
            validation_nodes: []
        };
    }

    const rowsByShard = new Map<string, DatasetManifestRow[]>();
    for (const row of rows) {
        const key = modulePairKey(row.generator, row.view);
        const pairNodeId = nodeId('pair', key);
        const executionNodes = executionNodesByPair.get(key);
        if (!nodes.has(pairNodeId) || !executionNodes) continue;
        const imageId = nodeId('image', row.sample_key);
        const reusableImage = reuseImageIdentityFrom?.nodes[imageId];
        const imageDigest = reusableImage?.output
            ? {
                sha256: reusableImage.output.content_hash,
                bytes: reusableImage.output.bytes ?? 0
            }
            : datasetSnapshot.imageIdentity(row._split, row.sample_key);
        const rowMatchNodes = targetIdsOf(row)
            .map(targetId => matchNodeByTargetAndPair.get(`${targetId}\u0000${key}`))
            .filter((id): id is string => Boolean(id));
        addNode(nodes, {
            id: imageId,
            kind: 'image',
            input_hash: reusableImage?.input_hash ?? digestIdentity({
                sample_key: row.sample_key,
                content_fingerprint: row.content_fingerprint ?? null,
                task_fingerprint: row.task_fingerprint ?? null,
                image_sha256: imageDigest.sha256
            }),
            dependencies: [pairNodeId, ...rowMatchNodes],
            output: {content_hash: imageDigest.sha256, bytes: imageDigest.bytes}
        });
        const labelDependencies = ontologyDependencies(row.tags ?? [], true);
        const checklist = checklistDependencies.get(row.view);
        if (!checklist) throw new Error(`VQA checklist dependencies are missing for view ${row.view}.`);
        const vqaId = nodeId('vqa', row.sample_key);
        const vqaDependencies = radixSortUtf8([
            imageId,
            validationPolicyId,
            ...checklist.ids,
            ...labelDependencies
        ]);
        const validationCacheKey = vqaContextResolver.resolve(
            imageDigest.sha256,
            checklist.paths,
            row.tags ?? []
        ).validationCacheKey;
        counters?.add('vqa.graph_key_recomputes');
        addNode(nodes, {
            id: vqaId,
            kind: 'vqa-record',
            input_hash: validationCacheKey,
            dependencies: vqaDependencies
        });
        executionNodes.add(imageId);
        executionNodes.add(vqaId);
        renderNodesByPair.get(key)?.add(imageId);
        validationNodesByPair.get(key)?.add(vqaId);
        for (const targetId of targetIdsOf(row)) {
            const targetImages = imageNodesByTarget.get(targetId);
            if (targetImages) targetImages.push(imageId);
            else imageNodesByTarget.set(targetId, [imageId]);
        }
        const shardKey = `${key}#${row._split}`;
        const shardRows = rowsByShard.get(shardKey);
        if (shardRows) shardRows.push(row);
        else rowsByShard.set(shardKey, [row]);
    }

    for (const shardKey of radixSortUtf8([...rowsByShard.keys()])) {
        const rowsInShard = rowsByShard.get(shardKey)!;
        const first = rowsInShard[0];
        const key = modulePairKey(first.generator, first.view);
        const shardId = nodeId('shard', shardKey);
        const imageIds = radixSortUtf8(rowsInShard.map(row => nodeId('image', row.sample_key)));
        const shardHash = digestIdentity(rowsInShard.map(row => ({
            sample_key: row.sample_key,
            image: nodes.get(nodeId('image', row.sample_key))?.output?.content_hash
        })));
        addNode(nodes, {
            id: shardId,
            kind: 'dataset-shard',
            input_hash: shardHash,
            dependencies: [nodeId('pair', key), ...imageIds],
            output: {content_hash: shardHash}
        });
        executionNodesByPair.get(key)?.add(shardId);
        renderNodesByPair.get(key)?.add(shardId);
    }

    for (const target of targets) {
        const assetId = nodeId('asset-index', `${specName}:${target.id}`);
        const coverageId = nodeId('coverage', `${specName}:${target.id}`);
        const targetId = targetNodeByTarget.get(target.id)!;
        const matchIds = radixSortUtf8([...(pairsByTarget.get(target.id) ?? [])]
            .map(key => matchNodeByTargetAndPair.get(`${target.id}\u0000${key}`))
            .filter((id): id is string => id !== undefined && nodes.has(id)));
        const imageIds = radixSortUtf8([...new Set(imageNodesByTarget.get(target.id) ?? [])]);
        addNode(nodes, {
            id: assetId,
            kind: 'asset-index-record',
            input_hash: digestIdentity({producer: 'asset-index-v1', target: target.id}),
            dependencies: [targetId, ...imageIds]
        });
        addNode(nodes, {
            id: coverageId,
            kind: 'coverage-record',
            input_hash: digestIdentity({producer: 'coverage-v1', target: target.id}),
            dependencies: [targetId, assetId, ...matchIds]
        });
    }

    for (const [key, entry] of Object.entries(entries)) {
        entry.execution_nodes = radixSortUtf8([...(executionNodesByPair.get(key) ?? [])]);
        entry.render_nodes = radixSortUtf8([...(renderNodesByPair.get(key) ?? [])]);
        entry.validation_nodes = radixSortUtf8([...(validationNodesByPair.get(key) ?? [])]);
    }
    const dependencyGraph = createDependencyGraphSnapshot(
        [...nodes.values()],
        DEPENDENCY_PLANNER_EPOCH,
        buildDependencyMatchingIndex(targets, tuples)
    );
    return {
        entries,
        dependency_graph: dependencyGraph,
        development_observation: captureDevelopmentInputObservation({
            projectRoot,
            specName,
            graph: dependencyGraph,
            sourceIndex,
            rendererEnvironment,
            entryFilesByNode: Object.fromEntries([
                ...generators.map(generator => [
                    nodeId('generator', generator.generatorId),
                    relative(projectRoot, resolve(generator.module.absolutePath, 'generator.ts'))
                        .replaceAll('\\', '/')
                ]),
                ...views.map(view => [
                    nodeId('view', view.viewId),
                    relative(projectRoot, resolve(view.module.absolutePath, 'view.tsx'))
                        .replaceAll('\\', '/')
                ])
            ])
        }),
        source_stats: sourceIndex.stats(),
        ontology_semantics: {
            ontology_entities: Object.keys(ontologySemantics.ontology?.entities ?? {}).length,
            ontology_relations: Object.keys(ontologySemantics.ontology?.relations ?? {}).length,
            dependency: datasetOntologyDependency(projectRoot),
            provenance_hash: datasetOntologyProvenanceHash(projectRoot)
        }
    };
}

export function readDatasetManifest(datasetDir: string): DatasetManifest | null {
    return (readDatasetSnapshot(datasetDir).buildManifest as DatasetManifest | null) ?? null;
}

function selectedPair(
    key: string,
    entry: DatasetManifestEntry,
    scope: ManifestUpdateScope,
    generators: ReadonlySet<string>,
    views: ReadonlySet<string> | null,
    pairs: ReadonlySet<string> | null
): boolean {
    if (scope.fullDataset) return true;
    if (pairs) return pairs.has(key);
    return generators.has(entry.generator) && (!views || views.has(entry.view));
}

function executionPlan(plan: DependencyDeltaPlan): DatasetExecutionPlan {
    const {reusable_outputs: _outputs, ...stored} = plan;
    return stored;
}

export function createDatasetManifest(options: {
    projectRoot: string;
    specName: string;
    build: DatasetManifestBuild;
    scope: ManifestUpdateScope;
    previous: DatasetManifest | null;
}): DatasetManifest {
    const {projectRoot, specName, build, scope, previous} = options;
    const plan = assertDatasetGenerationScope(previous, build, scope);
    return {
        schema_version: DATASET_MANIFEST_SCHEMA_VERSION,
        planner_epoch: DEPENDENCY_PLANNER_EPOCH,
        complete: true,
        spec: specName,
        ontology_dependency: datasetOntologyDependency(projectRoot),
        ontology_provenance_hash: datasetOntologyProvenanceHash(projectRoot),
        generated_at: new Date().toISOString(),
        ...(build.development_observation
            ? {development_observation: build.development_observation}
            : {}),
        dependency_graph: build.dependency_graph,
        last_execution: executionPlan(plan),
        entries: Object.fromEntries(radixSortUtf8(Object.keys(build.entries))
            .map(key => [key, build.entries[key]]))
    };
}

/** Resolves exact current and removed pair units reached by a dependency delta. */
export function affectedDatasetPairKeys(
    plan: DependencyDeltaPlan,
    build: DatasetManifestBuild,
    previous: DatasetManifest | null
): string[] {
    const affected = new Set(plan.affected_nodes);
    const keys = new Set<string>();
    for (const [key, entry] of new Map([
        ...Object.entries(previous?.entries ?? {}),
        ...Object.entries(build.entries)
    ])) {
        if ((entry.render_nodes ?? entry.execution_nodes).some(node => affected.has(node))) keys.add(key);
    }
    for (const node of plan.removed_nodes) {
        if (node.startsWith('pair:')) keys.add(node.slice('pair:'.length));
    }
    return radixSortUtf8([...keys]);
}

/** Fails before rendering when an explicit scope omits part of the affected closure. */
export function assertDatasetGenerationScope(
    previous: DatasetManifest | null,
    build: DatasetManifestBuild,
    scope: ManifestUpdateScope
): DependencyDeltaPlan {
    const plan = planDependencyDelta(previous?.dependency_graph ?? null, build.dependency_graph);
    if (scope.fullDataset || plan.clean) return plan;
    const affected = new Set(plan.affected_nodes);
    const generators = new Set(scope.generatorIds);
    const views = scope.viewIds ? new Set(scope.viewIds) : null;
    const pairs = scope.pairKeys ? new Set(scope.pairKeys) : null;
    const entries = new Map([
        ...Object.entries(previous?.entries ?? {}),
        ...Object.entries(build.entries)
    ]);
    const outsideScope = [...entries].filter(([key, entry]) =>
        !selectedPair(key, entry, scope, generators, views, pairs)
        && (entry.render_nodes ?? entry.execution_nodes).some(id => affected.has(id))
    );
    if (outsideScope.length > 0) {
        const first = outsideScope[0];
        const causeNode = (first[1].render_nodes ?? first[1].execution_nodes)
            .find(id => affected.has(id))!;
        const cause = explainAffectedNode(plan, causeNode) ?? causeNode;
        throw new Error(
            `Scoped generation affects ${outsideScope.length} generator/view pair(s) outside its selection; `
            + `first is ${first[0]} via ${cause}. Run the broader affected scope or a full generation.`
        );
    }
    return plan;
}

export function datasetFreshnessIssues(
    manifest: DatasetManifest | null,
    specName: string,
    currentBuild: DatasetManifestBuild
): string[] {
    if (!manifest) return ['manifest.json is missing; regenerate this dataset.'];
    const issues: string[] = [];
    if (manifest.schema_version !== DATASET_MANIFEST_SCHEMA_VERSION) {
        issues.push(`manifest schema ${manifest.schema_version} is not supported (expected ${DATASET_MANIFEST_SCHEMA_VERSION}).`);
    }
    if (manifest.planner_epoch !== DEPENDENCY_PLANNER_EPOCH || manifest.complete !== true) {
        issues.push('manifest dependency plan is incomplete or uses an unsupported planner epoch.');
    }
    if (manifest.spec !== specName) issues.push(`manifest belongs to spec "${manifest.spec}", not "${specName}".`);
    if ((currentBuild.ontology_semantics.dependency
            && manifest.ontology_dependency !== currentBuild.ontology_semantics.dependency)
        || (currentBuild.ontology_semantics.provenance_hash
            && manifest.ontology_provenance_hash !== currentBuild.ontology_semantics.provenance_hash)) {
        issues.push('manifest ontology provenance differs from the exact installed ontology.');
    }
    if (issues.length > 0) return issues;

    for (const [key, current] of Object.entries(currentBuild.entries)) {
        const recorded = manifest.entries[key];
        if (!recorded) {
            issues.push(`${key} is missing from the manifest.`);
        } else if (recorded.input_hash !== current.input_hash) {
            issues.push(`${key} is stale: generation source, target, or ontology inputs changed.`);
        } else if (recorded.content_hash !== current.content_hash) {
            issues.push(`${key} content or task fingerprints changed since generation.`);
        } else if (JSON.stringify(recorded.sample_counts) !== JSON.stringify(current.sample_counts)) {
            issues.push(`${key} metadata counts changed since generation.`);
        }
    }
    for (const key of Object.keys(manifest.entries)) {
        if (!currentBuild.entries[key]) issues.push(`${key} remains in the manifest but no longer matches the current spec.`);
    }

    if (manifest.dependency_graph) {
        const plan = planDependencyDelta(manifest.dependency_graph, currentBuild.dependency_graph);
        const selectedNodes = new Set(Object.values(currentBuild.entries)
            .flatMap(entry => entry.render_nodes ?? entry.execution_nodes));
        const affected = plan.affected_nodes.filter(id => selectedNodes.has(id));
        if (affected.length > 0) {
            const first = affected[0];
            issues.push(
                `${affected.length} selected dependency node(s) are stale; first affected path: `
                + `${explainAffectedNode(plan, first) ?? first}.`
            );
        }
    }
    return issues;
}

export function datasetRendererIssues(
    manifest: DatasetManifest | null,
    expectedRendererEnvironment: string
): string[] {
    if (!manifest) return ['manifest.json is missing; renderer environment cannot be verified.'];
    return Object.entries(manifest.entries)
        .filter(([, entry]) => entry.renderer_environment !== expectedRendererEnvironment)
        .map(([key, entry]) =>
            `${key} was rendered by "${entry.renderer_environment || 'unknown'}" instead of "${expectedRendererEnvironment}".`
        );
}
