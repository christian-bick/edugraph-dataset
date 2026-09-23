import {readFileSync} from 'node:fs';
import {basename, extname, isAbsolute, relative, resolve} from 'node:path';
import {Ability, Area, Scope} from 'edugraph-ts';
import type {CompetencyTarget} from '../types/ml-engine.ts';
import type {ConfigSchema} from '../types/schema.ts';
import type {DependencyGraphSnapshot} from './dependency-planner.ts';
import {
    DEPENDENCY_GRAPH_SCHEMA_VERSION,
    DEPENDENCY_PLANNER_EPOCH
} from './dependency-planner.ts';
import type {
    GeneratorModelDescriptor,
    ViewModelDescriptor
} from './model-catalog.ts';
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
    type CompatibleModulePairIndex,
    type MatchTuple
} from './matching.ts';
import {getCapabilityAncestors} from './ontology.ts';
import {extractSchemaLabels, shortenLabel} from './utils.ts';
import {digestIdentity, radixSortUtf8} from './content-identity.ts';
import {createWorkCounters, type WorkCounters} from './work-counters.ts';
import {ModelSourceIndex} from './model-source-index.ts';
import {SourceSymbolIndex} from './source-symbol-index.ts';
import {inspectSpecSource} from './spec-source-contracts.ts';
import {inspectImplementationSource} from './implementation-contracts.ts';
import {inspectApplicability, type ApplicabilityIssue} from './spec-contracts.ts';
import {collectPositiveCapabilities, inspectPositiveOwnership,
    type CapabilityProvider, type CapabilityRole,
    type PositiveOwnershipIssue} from './spec-ownership.ts';
export type {CapabilityProvider, CapabilityRole, CapabilityDeclaration} from './spec-ownership.ts';

export const LABEL_ARCHITECTURE_AUDIT_SCHEMA_VERSION = 2;

const areaLabels = new Set<string>(Object.values(Area));
const scopeLabels = new Set<string>(Object.values(Scope));
const abilityLabels = new Set<string>(Object.values(Ability));

export type LabelDimension = 'Area' | 'Scope' | 'Ability' | 'Other';
export type FindingDisposition = 'violation' | 'review' | 'signal';

export interface AuditTupleRef {
    target_id: string;
    generator_id: string;
    view_id: string;
}

export interface CapabilityProvenance {
    target_id: string;
    generator_id: string;
    view_id: string;
    target_label: string;
    dimension: LabelDimension;
    providers: CapabilityProvider[];
}

export interface SchemaParameterAudit {
    role: CapabilityRole;
    module_id: string;
    parameter: string;
    labels: string[];
    dimensions: LabelDimension[];
}

export interface SourceSignal {
    kind: 'raw-label-access' | 'raw-ontology-iri' | 'payload-field-candidate'
        | 'spec-source-contract' | 'implementation-contract';
    module_id: string;
    role: CapabilityRole;
    file: string;
    line: number;
    value: string;
    disposition?: FindingDisposition;
}

export interface LabelArchitectureFinding {
    id: string;
    category: string;
    disposition: FindingDisposition;
    summary: string;
    modules: string[];
    labels: string[];
    files: string[];
    affected_tuple_count: number;
    affected_tuples: AuditTupleRef[];
    ownership?: PositiveOwnershipIssue;
    applicability?: ApplicabilityIssue;
}

export interface LabelArchitectureAuditReport {
    schema_version: number;
    spec: string;
    matching: {
        source: 'persisted-graph' | 'fresh-indexed-match';
        graph_reuse_reason: string;
        targets: number;
        compatible_pairs: number;
        matched_tuples: number;
    };
    target_dimensions: {
        cardinality: Record<'Area' | 'Scope' | 'Ability', Record<string, number>>;
        without_area: string[];
        without_scope: string[];
        without_ability: string[];
        multiple_area: string[];
        multiple_scope: string[];
        multiple_ability: string[];
    };
    module_inventory: {
        generators: number;
        views: number;
        generator_schema_parameters: number;
        view_schema_parameters: number;
        ability_parameterized_views: string[];
        views_with_required_labels: string[];
        views_with_rejected_labels: string[];
        views_with_positive_areas: string[];
    };
    schema_parameters: SchemaParameterAudit[];
    capability_provenance: CapabilityProvenance[];
    source_signals: SourceSignal[];
    findings: LabelArchitectureFinding[];
    work: Readonly<Record<string, number>>;
}

interface DeclaredCapability extends CapabilityProvider {
    dimension: LabelDimension;
}

interface MatchingResolution {
    tuples: MatchTuple[];
    source: 'persisted-graph' | 'fresh-indexed-match';
    reason: string;
}

const tupleKey = (tuple: AuditTupleRef): string =>
    `${tuple.target_id}\u0000${tuple.generator_id}\u0000${tuple.view_id}`;

const tupleRef = (tuple: MatchTuple): AuditTupleRef => ({
    target_id: tuple.target.id,
    generator_id: tuple.generatorId,
    view_id: tuple.viewId
});

const orderTuples = (tuples: readonly AuditTupleRef[]): AuditTupleRef[] => {
    const byKey = new Map(tuples.map(tuple => [tupleKey(tuple), tuple]));
    return radixSortUtf8([...byKey.keys()]).map(key => byKey.get(key)!);
};

export function labelDimension(label: string): LabelDimension {
    if (areaLabels.has(label)) return 'Area';
    if (scopeLabels.has(label)) return 'Scope';
    if (abilityLabels.has(label)) return 'Ability';
    return 'Other';
}

function schemaParameterCapabilities(
    role: CapabilityRole,
    moduleId: string,
    schema: ConfigSchema
): DeclaredCapability[] {
    return collectPositiveCapabilities({role, module_id: moduleId, generalLabels: [], schema})
        .map(capability => ({...capability, dimension: labelDimension(capability.capability)}));
}

function generalCapabilities(
    role: CapabilityRole,
    moduleId: string,
    labels: readonly string[]
): DeclaredCapability[] {
    return collectPositiveCapabilities({role, module_id: moduleId, generalLabels: labels})
        .map(capability => ({...capability, dimension: labelDimension(capability.capability)}));
}

function generatorSchema(generator: GeneratorModelDescriptor): ConfigSchema {
    return generator.schema ?? {};
}

function declaredGeneratorCapabilities(generator: GeneratorModelDescriptor): DeclaredCapability[] {
    return [
        ...generalCapabilities('generator', generator.generatorId, generator.spec?.generalLabels ?? []),
        ...schemaParameterCapabilities('generator', generator.generatorId, generatorSchema(generator))
    ];
}

function viewCapabilities(view: ViewModelDescriptor): DeclaredCapability[] {
    return [
        ...generalCapabilities('view', view.viewId, view.spec.generalLabels ?? []),
        ...schemaParameterCapabilities('view', view.viewId, view.schema)
    ];
}

function sameStrings(left: readonly string[], right: readonly string[]): boolean {
    if (left.length !== right.length) return false;
    for (let index = 0; index < left.length; index++) {
        if (left[index] !== right[index]) return false;
    }
    return true;
}

function graphCapabilityIds(graph: DependencyGraphSnapshot, kind: string): string[] {
    return radixSortUtf8(Object.values(graph.nodes)
        .filter(node => node.kind === kind)
        .map(node => node.id));
}

/**
 * Reuses successful matching from the dataset graph only when every current
 * target/module capability hash and compatible pair is represented exactly.
 */
export function reuseAuditTuplesFromGraph(options: {
    specName: string;
    targets: CompetencyTarget[];
    generators: GeneratorModelDescriptor[];
    views: ViewModelDescriptor[];
    pairIndex: CompatibleModulePairIndex;
    graph: DependencyGraphSnapshot | null;
}): {tuples: MatchTuple[] | null; reason: string} {
    const {specName, targets, generators, views, pairIndex, graph} = options;
    if (!graph) return {tuples: null, reason: 'no persisted dataset dependency graph'};
    if (graph.schema_version !== DEPENDENCY_GRAPH_SCHEMA_VERSION
        || graph.planner_epoch !== DEPENDENCY_PLANNER_EPOCH
        || graph.complete !== true) {
        return {tuples: null, reason: 'persisted graph schema or planner epoch is not current'};
    }
    if (!graph.matching_index) {
        return {tuples: null, reason: 'persisted graph has no matching index'};
    }
    if (graph.nodes[matchingPolicyNodeId()]?.input_hash !== matchingPolicyInputHash()) {
        return {tuples: null, reason: 'matching policy identity differs'};
    }

    const expectedTargetIds = radixSortUtf8(targets.map(target =>
        targetCapabilityNodeId(specName, target.id)));
    const expectedGeneratorIds = radixSortUtf8(generators.map(generator =>
        generatorCapabilityNodeId(generator.generatorId)));
    const expectedViewIds = radixSortUtf8(views.map(view => viewCapabilityNodeId(view.viewId)));
    const expectedPairIds = radixSortUtf8(pairIndex.orderedPairs.map(pair => modulePairNodeId(
        pair.generator.generatorId,
        pair.view.viewId
    )));
    if (!sameStrings(expectedTargetIds, graphCapabilityIds(graph, 'target-capability'))
        || !sameStrings(expectedGeneratorIds, graphCapabilityIds(graph, 'generator-capability'))
        || !sameStrings(expectedViewIds, graphCapabilityIds(graph, 'view-capability'))
        || !sameStrings(expectedPairIds, graphCapabilityIds(graph, 'module-pair'))) {
        return {tuples: null, reason: 'current target/module capability topology differs'};
    }
    for (const target of targets) {
        if (graph.nodes[targetCapabilityNodeId(specName, target.id)]?.input_hash
            !== targetCapabilityInputHash(target)) {
            return {tuples: null, reason: `target capability changed: ${target.id}`};
        }
    }
    for (const generator of generators) {
        if (graph.nodes[generatorCapabilityNodeId(generator.generatorId)]?.input_hash
            !== generatorCapabilityInputHash(generator)) {
            return {tuples: null, reason: `generator capability changed: ${generator.generatorId}`};
        }
    }
    for (const view of views) {
        if (graph.nodes[viewCapabilityNodeId(view.viewId)]?.input_hash
            !== viewCapabilityInputHash(view)) {
            return {tuples: null, reason: `view capability changed: ${view.viewId}`};
        }
    }
    const expectedPostingIndex = buildDependencyMatchingIndex(targets);
    const normalizedExpectedPostings = Object.fromEntries(radixSortUtf8(
        Object.keys(expectedPostingIndex.target_ids_by_label)
    ).map(label => [
        label,
        radixSortUtf8([...new Set(expectedPostingIndex.target_ids_by_label[label])])
    ]));
    if (JSON.stringify(normalizedExpectedPostings)
        !== JSON.stringify(graph.matching_index.target_ids_by_label)
        || !sameStrings(
            radixSortUtf8([...new Set(expectedPostingIndex.targets_without_ontology_labels)]),
            graph.matching_index.targets_without_ontology_labels
        )) {
        return {tuples: null, reason: 'persisted target-label postings differ'};
    }

    const targetsById = new Map(targets.map(target => [target.id, target]));
    const pairs = new Set(pairIndex.orderedPairs.map(pair => modulePairKey(
        pair.generator.generatorId,
        pair.view.viewId
    )));
    const tuples: MatchTuple[] = [];
    for (const targetId of radixSortUtf8(Object.keys(
        graph.matching_index.matched_pair_keys_by_target
    ))) {
        const target = targetsById.get(targetId);
        if (!target) return {tuples: null, reason: `persisted match references unknown target: ${targetId}`};
        for (const pairKey of graph.matching_index.matched_pair_keys_by_target[targetId]) {
            if (!pairs.has(pairKey)) {
                return {tuples: null, reason: `persisted match references incompatible pair: ${pairKey}`};
            }
            const separator = pairKey.indexOf('#');
            const generatorId = pairKey.slice(0, separator);
            const viewId = pairKey.slice(separator + 1);
            if (!graph.nodes[matchTupleNodeId(specName, targetId, generatorId, viewId)]) {
                return {tuples: null, reason: `persisted matching index lacks tuple node: ${targetId}#${pairKey}`};
            }
            tuples.push({target, generatorId, viewId});
        }
    }
    return {tuples, reason: 'all current capability hashes and pair topology match the persisted graph'};
}

function resolveMatching(options: {
    specName: string;
    targets: CompetencyTarget[];
    generators: GeneratorModelDescriptor[];
    views: ViewModelDescriptor[];
    pairIndex: CompatibleModulePairIndex;
    graph: DependencyGraphSnapshot | null;
    counters: WorkCounters;
}): MatchingResolution {
    const reused = reuseAuditTuplesFromGraph(options);
    if (reused.tuples) {
        return {tuples: reused.tuples, source: 'persisted-graph', reason: reused.reason};
    }
    return {
        tuples: matchTargets(options.targets, options.generators, options.views, {
            pairIndex: options.pairIndex,
            counters: options.counters
        }).tuples,
        source: 'fresh-indexed-match',
        reason: `fresh indexed matching required: ${reused.reason}`
    };
}

function matchesWithLines(content: string, pattern: RegExp): Array<{match: RegExpMatchArray; line: number}> {
    pattern.lastIndex = 0;
    const matches: Array<{match: RegExpMatchArray; line: number}> = [];
    let cursor = 0;
    let line = 1;
    for (const match of content.matchAll(pattern)) {
        const offset = match.index ?? cursor;
        for (; cursor < offset; cursor++) if (content.charCodeAt(cursor) === 10) line++;
        matches.push({match, line});
    }
    return matches;
}

const PAYLOAD_FIELD_PATTERN = /\b(prompt|instruction|instructions|hint|explanation|rationale|question(?:[A-Z][A-Za-z0-9_]*)?|answer(?:Statement|Text|Sentence|Explanation|Prompt)[A-Za-z0-9_]*|solution(?:[A-Z][A-Za-z0-9_]*)|unknown(?:[A-Z][A-Za-z0-9_]*)?|blank(?:[A-Z][A-Za-z0-9_]*)?|responseDirection)\s*:/g;

export function scanImplementationSource(options: {
    role: CapabilityRole;
    moduleId: string;
    file: string;
    content: string;
    includePayloadFields?: boolean;
    symbols?: SourceSymbolIndex;
}): SourceSignal[] {
    const signals: SourceSignal[] = inspectImplementationSource(options.content, options.file,
        options.role, options.symbols).map(issue => ({
        kind: issue.kind ?? 'implementation-contract', role: options.role,
        module_id: options.moduleId, file: options.file, line: issue.line,
        value: issue.value ?? issue.message
    }));
    if (options.role === 'generator' && options.includePayloadFields !== false) {
        for (const {match, line} of matchesWithLines(options.content, PAYLOAD_FIELD_PATTERN)) {
            signals.push({
                kind: 'payload-field-candidate',
                role: options.role,
                module_id: options.moduleId,
                file: options.file,
                line,
                value: match[1]
            });
        }
    }
    const byKey = new Map(signals.map(signal => [
        `${signal.kind}\u0000${signal.module_id}\u0000${signal.file}\u0000${signal.line}\u0000${signal.value}`,
        signal
    ]));
    return radixSortUtf8([...byKey.keys()]).map(key => byKey.get(key)!);
}

function scanModuleSources(
    projectRoot: string,
    generators: readonly GeneratorModelDescriptor[],
    views: readonly ViewModelDescriptor[],
    counters: WorkCounters
): SourceSignal[] {
    const signals: SourceSignal[] = [];
    const sourceIndex = new ModelSourceIndex(projectRoot, {includeAssets: false, counters});
    const symbols = new SourceSymbolIndex();
    for (const item of [
        ...generators.map(module => ({role: 'generator' as const, id: module.generatorId, path: module.module.absolutePath})),
        ...views.map(module => ({role: 'view' as const, id: module.viewId, path: module.module.absolutePath}))
    ]) {
        const absolute = resolve(item.path, 'spec.ts');
        const file = relative(projectRoot, absolute).replaceAll('\\', '/');
        for (const issue of inspectSpecSource(readFileSync(absolute, 'utf-8'), absolute, symbols)) {
            signals.push({kind: 'spec-source-contract', role: item.role, module_id: item.id,
                file, line: issue.line, value: `${issue.rule} ${issue.field}: ${issue.message}`,
                disposition: issue.severity === 'review' ? 'review' : 'violation'});
        }
    }
    const ownersByFile = new Map<string, Array<{role: CapabilityRole; moduleId: string}>>();
    const generatorsRoot = resolve(projectRoot, 'src', 'generators');
    const viewsRoot = resolve(projectRoot, 'src', 'visuals');
    const within = (path: string, root: string) => {
        const pathFromRoot = relative(root, path);
        return pathFromRoot === '' || (!pathFromRoot.startsWith('..') && !isAbsolute(pathFromRoot));
    };
    const includeSource = (path: string) => {
        const extension = extname(path);
        const name = basename(path);
        const projectPath = relative(projectRoot, path).replaceAll('\\', '/');
        return ['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs'].includes(extension)
            && name !== 'spec.ts'
            && projectPath !== 'src/visuals/views/withConfig.tsx'
            && !name.endsWith('.test.ts')
            && !name.endsWith('.test.tsx')
            && (within(path, generatorsRoot) || within(path, viewsRoot));
    };
    const addOwner = (path: string, role: CapabilityRole, moduleId: string) => {
        if (!includeSource(path)) return;
        const owners = ownersByFile.get(path);
        if (owners) owners.push({role, moduleId});
        else ownersByFile.set(path, [{role, moduleId}]);
        counters.add('label_audit.source_owner_edges');
    };
    for (const generator of generators) {
        for (const path of sourceIndex.dependencies([
            resolve(generator.module.absolutePath, 'generator.ts')
        ])) addOwner(path, 'generator', generator.generatorId);
    }
    for (const view of views) {
        for (const path of sourceIndex.dependencies([
            resolve(view.module.absolutePath, 'view.tsx')
        ])) addOwner(path, 'view', view.viewId);
    }
    for (const absolute of radixSortUtf8([...ownersByFile.keys()])) {
        const content = readFileSync(absolute, 'utf-8');
        counters.add('label_audit.source_files_read');
        counters.add('label_audit.source_bytes_read', Buffer.byteLength(content));
        const file = relative(projectRoot, absolute).replaceAll('\\', '/');
        for (const owner of ownersByFile.get(absolute) ?? []) {
            signals.push(...scanImplementationSource({
                role: owner.role,
                moduleId: owner.moduleId,
                file,
                content,
                symbols,
                includePayloadFields: basename(absolute) === 'generator.ts'
            }));
        }
    }
    const byKey = new Map(signals.map(signal => [
        `${signal.kind}\u0000${signal.role}\u0000${signal.module_id}\u0000${signal.file}\u0000${signal.line}\u0000${signal.value}`,
        signal
    ]));
    return radixSortUtf8([...byKey.keys()]).map(key => byKey.get(key)!);
}

function schemaParameterAudit(
    role: CapabilityRole,
    moduleId: string,
    schema: ConfigSchema
): SchemaParameterAudit[] {
    return radixSortUtf8(Object.keys(schema)).map(parameter => {
        const labels = radixSortUtf8([...new Set(extractSchemaLabels({
            [parameter]: schema[parameter]
        }))]);
        return {
            role,
            module_id: moduleId,
            parameter,
            labels,
            dimensions: radixSortUtf8([...new Set(labels.map(labelDimension))]) as LabelDimension[]
        };
    });
}

function cardinality(targets: readonly CompetencyTarget[], dimension: LabelDimension): Record<string, number> {
    const counts = new Map<number, number>();
    for (const target of targets) {
        const count = target.labels.filter(label => labelDimension(label) === dimension).length;
        counts.set(count, (counts.get(count) ?? 0) + 1);
    }
    const keys = radixSortUtf8([...counts.keys()].map(String));
    return Object.fromEntries(keys.map(key => [key, counts.get(Number(key))!]));
}

function targetIdsByDimensionCount(
    targets: readonly CompetencyTarget[],
    dimension: LabelDimension,
    predicate: (count: number) => boolean
): string[] {
    return radixSortUtf8(targets
        .filter(target => predicate(target.labels.filter(label => labelDimension(label) === dimension).length))
        .map(target => target.id));
}

interface AuditTupleIndex {
    byTarget: Map<string, AuditTupleRef[]>;
    byGenerator: Map<string, AuditTupleRef[]>;
    byView: Map<string, AuditTupleRef[]>;
    byPair: Map<string, AuditTupleRef[]>;
}

function indexAuditTuples(tuples: readonly MatchTuple[], counters: WorkCounters): AuditTupleIndex {
    const index: AuditTupleIndex = {
        byTarget: new Map(),
        byGenerator: new Map(),
        byView: new Map(),
        byPair: new Map()
    };
    const add = (map: Map<string, AuditTupleRef[]>, key: string, ref: AuditTupleRef) => {
        const group = map.get(key);
        if (group) group.push(ref);
        else map.set(key, [ref]);
    };
    for (const tuple of tuples) {
        const ref = tupleRef(tuple);
        add(index.byTarget, tuple.target.id, ref);
        add(index.byGenerator, tuple.generatorId, ref);
        add(index.byView, tuple.viewId, ref);
        add(index.byPair, modulePairKey(tuple.generatorId, tuple.viewId), ref);
        counters.add('label_audit.tuple_index_entries', 4);
    }
    return index;
}

function finding(options: Omit<LabelArchitectureFinding, 'id' | 'affected_tuple_count'>): LabelArchitectureFinding {
    const modules = radixSortUtf8([...new Set(options.modules)]);
    const labels = radixSortUtf8([...new Set(options.labels)]);
    const files = radixSortUtf8([...new Set(options.files)]);
    const affectedTuples = orderTuples(options.affected_tuples);
    const identity = [options.category, options.summary, ...modules, ...labels, ...files].join('|');
    return {
        id: `${options.category}:${digestIdentity(identity).slice(0, 12)}`,
        category: options.category,
        disposition: options.disposition,
        summary: options.summary,
        modules,
        labels,
        files,
        affected_tuple_count: affectedTuples.length,
        affected_tuples: affectedTuples,
        ...(options.ownership ? {ownership: options.ownership} : {}),
        ...(options.applicability ? {applicability: options.applicability} : {})
    };
}

function provenanceForTuples(options: {
    tuples: readonly MatchTuple[];
    generators: readonly GeneratorModelDescriptor[];
    views: readonly ViewModelDescriptor[];
    counters: WorkCounters;
}): CapabilityProvenance[] {
    const generators = new Map(options.generators.map(generator => [
        generator.generatorId,
        declaredGeneratorCapabilities(generator)
    ]));
    const views = new Map(options.views.map(view => [view.viewId, viewCapabilities(view)]));
    const providersByPair = new Map<string, Map<string, CapabilityProvider[]>>();
    const providerIndex = (generatorId: string, viewId: string) => {
        const pairKey = modulePairKey(generatorId, viewId);
        const cached = providersByPair.get(pairKey);
        if (cached) return cached;
        const bySatisfiedLabel = new Map<string, CapabilityProvider[]>();
        const capabilities = [
            ...(generators.get(generatorId) ?? []),
            ...(views.get(viewId) ?? [])
        ];
        for (const capability of capabilities) {
            const {dimension: _dimension, ...provider} = capability;
            for (const satisfiedLabel of getCapabilityAncestors(capability.capability)) {
                const providers = bySatisfiedLabel.get(satisfiedLabel);
                if (providers) providers.push(provider);
                else bySatisfiedLabel.set(satisfiedLabel, [provider]);
                options.counters.add('label_audit.capability_closure_entries');
            }
        }
        providersByPair.set(pairKey, bySatisfiedLabel);
        return bySatisfiedLabel;
    };
    const records: CapabilityProvenance[] = [];
    for (const tuple of options.tuples) {
        const providers = providerIndex(tuple.generatorId, tuple.viewId);
        for (const targetLabel of radixSortUtf8([...new Set(tuple.target.labels)])) {
            const dimension = labelDimension(targetLabel);
            if (dimension === 'Other') continue;
            const exactProviders = providers.get(targetLabel) ?? [];
            options.counters.add('label_audit.tuple_label_lookups');
            options.counters.add('label_audit.provenance_provider_entries', exactProviders.length);
            records.push({
                target_id: tuple.target.id,
                generator_id: tuple.generatorId,
                view_id: tuple.viewId,
                target_label: targetLabel,
                dimension,
                providers: exactProviders
            });
        }
    }
    const byKey = new Map(records.map(record => [
        `${record.target_id}\u0000${record.generator_id}\u0000${record.view_id}\u0000${record.target_label}`,
        record
    ]));
    return radixSortUtf8([...byKey.keys()]).map(key => byKey.get(key)!);
}

export function buildLabelArchitectureAudit(options: {
    projectRoot: string;
    specName: string;
    targets: CompetencyTarget[];
    generators: GeneratorModelDescriptor[];
    views: ViewModelDescriptor[];
    graph?: DependencyGraphSnapshot | null;
    sourceSignals?: SourceSignal[];
    counters?: WorkCounters;
}): LabelArchitectureAuditReport {
    const counters = options.counters ?? createWorkCounters();
    const pairIndex = buildCompatibleModulePairIndex(options.generators, options.views, counters);
    const matching = resolveMatching({
        specName: options.specName,
        targets: options.targets,
        generators: options.generators,
        views: options.views,
        pairIndex,
        graph: options.graph ?? null,
        counters
    });
    const tuples = matching.tuples;
    const sourceSignals = options.sourceSignals ?? scanModuleSources(
        options.projectRoot,
        options.generators,
        options.views,
        counters
    );
    const tupleIndex = indexAuditTuples(tuples, counters);
    const findings: LabelArchitectureFinding[] = [];
    const addTargetFindings = (dimension: 'Area' | 'Ability') => {
        for (const target of options.targets) {
            if (target.labels.some(label => labelDimension(label) === dimension)) continue;
            findings.push(finding({
                category: `target-missing-${dimension.toLowerCase()}`,
                disposition: 'violation',
                summary: `Target ${target.id} has no ${dimension} label.`,
                modules: [],
                labels: target.labels,
                files: [],
                affected_tuples: tupleIndex.byTarget.get(target.id) ?? []
            }));
        }
    };
    addTargetFindings('Area');
    addTargetFindings('Ability');
    for (const target of options.targets) {
        if (tupleIndex.byTarget.has(target.id)) continue;
        findings.push(finding({
            category: 'target-without-match',
            disposition: 'violation',
            summary: `Target ${target.id} has no matched generator/view tuple.`,
            modules: [], labels: target.labels, files: [], affected_tuples: []
        }));
    }

    const viewCaps = new Map(options.views.map(view => [view.viewId, viewCapabilities(view)]));
    for (const view of options.views) {
        const abilityParameters = schemaParameterCapabilities('view', view.viewId, view.schema)
            .filter(capability => capability.dimension === 'Ability');
        if (abilityParameters.length > 0) {
            findings.push(finding({
                category: 'view-ability-parameterization',
                disposition: 'signal',
                summary: `View ${view.viewId} parameterizes Ability; review it for parallel task behavior.`,
                modules: [view.viewId],
                labels: abilityParameters.map(capability => capability.capability),
                files: [],
                affected_tuples: tupleIndex.byView.get(view.viewId) ?? []
            }));
        }
        if ((view.requiredLabels ?? []).length > 0) {
            findings.push(finding({
                category: 'required-label-review',
                disposition: 'review',
                summary: `Review whether ${view.viewId} requires an explicit target precondition.`,
                modules: [view.viewId], labels: [...(view.requiredLabels ?? [])], files: [],
                affected_tuples: tupleIndex.byView.get(view.viewId) ?? []
            }));
        }
        if ((view.rejectedLabels ?? []).length > 0) {
            findings.push(finding({
                category: 'rejected-label-review',
                disposition: 'review',
                summary: `Review whether ${view.viewId} rejections are stable, complete exclusion boundaries.`,
                modules: [view.viewId], labels: [...(view.rejectedLabels ?? [])], files: [],
                affected_tuples: tupleIndex.byView.get(view.viewId) ?? []
            }));
        }
        const positiveAreas = (viewCaps.get(view.viewId) ?? [])
            .filter(capability => capability.dimension === 'Area')
            .map(capability => capability.capability);
        if (positiveAreas.length > 0) {
            findings.push(finding({
                category: 'view-owned-area-review',
                disposition: 'review',
                summary: `Review whether ${view.viewId} Areas are independent knowledge domains rather than contextual Scopes.`,
                modules: [view.viewId], labels: positiveAreas, files: [],
                affected_tuples: tupleIndex.byView.get(view.viewId) ?? []
            }));
        }
    }

    const ownershipModules = [
        ...options.generators.map(generator => ({role: 'generator' as const,
            module_id: generator.generatorId, generalLabels: generator.spec?.generalLabels ?? [],
            schema: generator.schema, file: resolve(generator.module.absolutePath, 'spec.ts')})),
        ...options.views.map(view => ({role: 'view' as const,
            module_id: view.viewId, generalLabels: view.spec.generalLabels ?? [],
            schema: view.schema, file: resolve(view.module.absolutePath, 'spec.ts')}))
    ];
    const ownershipFiles = new Map(ownershipModules.map(module => [
        `${module.role}:${module.module_id}`, relative(options.projectRoot, module.file).replaceAll('\\', '/')
    ]));
    for (const issue of inspectPositiveOwnership({
        modules: ownershipModules,
        pairs: pairIndex.orderedPairs.map(pair => ({generatorId: pair.generator.generatorId, viewId: pair.view.viewId})),
        counters
    })) {
        const [first, second] = issue.declarations;
        const affectedTuples = issue.code === 'cross-role-positive-overlap'
            ? tupleIndex.byPair.get(modulePairKey(first.module_id, second.module_id))
            : (first.role === 'generator' ? tupleIndex.byGenerator : tupleIndex.byView).get(first.module_id);
        findings.push(finding({
            category: issue.code,
            disposition: 'violation',
            summary: issue.message,
            modules: issue.declarations.map(declaration => declaration.module_id),
            labels: issue.declarations.map(declaration => declaration.capability),
            files: issue.declarations.map(declaration => ownershipFiles.get(`${declaration.role}:${declaration.module_id}`)!),
            affected_tuples: affectedTuples ?? [],
            ownership: issue
        }));
    }

    const viewsById = new Map(options.views.map(view => [view.viewId, view]));
    for (const issue of inspectApplicability({views: options.views, pairIndex, counters})) {
        const generatorId = issue.kind === 'pair-missing-required-label' ? issue.generatorId : undefined;
        const affectedTuples = generatorId
            ? tupleIndex.byPair.get(modulePairKey(generatorId, issue.viewId))
            : tupleIndex.byView.get(issue.viewId);
        findings.push(finding({
            category: issue.kind === 'ability-rejection' ? 'view-ability-rejectedLabels' : issue.kind,
            disposition: 'violation',
            summary: issue.message,
            modules: generatorId ? [generatorId, issue.viewId] : [issue.viewId],
            labels: issue.kind === 'no-compatible-generator'
                ? [...(viewsById.get(issue.viewId)!.requiredLabels ?? [])]
                : issue.kind === 'required-and-rejected-label' ? [issue.label, issue.rejectedLabel] : [issue.label],
            files: [ownershipFiles.get(`view:${issue.viewId}`)!],
            affected_tuples: affectedTuples ?? [],
            applicability: issue
        }));
    }

    const signalsByModule = new Map<string, SourceSignal[]>();
    for (const signal of sourceSignals) {
        const key = `${signal.kind}\u0000${signal.role}\u0000${signal.module_id}\u0000${signal.disposition ?? ''}`;
        const group = signalsByModule.get(key);
        if (group) group.push(signal);
        else signalsByModule.set(key, [signal]);
    }
    for (const key of radixSortUtf8([...signalsByModule.keys()])) {
        const signals = signalsByModule.get(key)!;
        const signal = signals[0];
        const values = radixSortUtf8([...new Set(signals.map(entry => entry.value))]);
        findings.push(finding({
            category: signal.kind,
            disposition: signal.disposition ?? (signal.kind === 'payload-field-candidate' ? 'review' : 'violation'),
            summary: signal.kind === 'spec-source-contract' || signal.kind === 'implementation-contract'
                ? `${signal.role} ${signal.module_id} has declaration source violations: ${values.join(', ')}.`
                : signal.kind === 'payload-field-candidate'
                ? `Generator ${signal.module_id} contains candidate payload fields: ${values.join(', ')}.`
                : `${signal.role} ${signal.module_id} accesses unresolved ontology data: ${values.join(', ')}.`,
            modules: [signal.module_id], labels: [],
            files: signals.map(entry => `${entry.file}:${entry.line}`),
            affected_tuples: signal.role === 'generator'
                ? tupleIndex.byGenerator.get(signal.module_id) ?? []
                : tupleIndex.byView.get(signal.module_id) ?? []
        }));
    }

    const schemaParameters = [
        ...options.generators.flatMap(generator => schemaParameterAudit(
            'generator', generator.generatorId, generatorSchema(generator)
        )),
        ...options.views.flatMap(view => schemaParameterAudit('view', view.viewId, view.schema))
    ];
    const orderSchema = new Map(schemaParameters.map(parameter => [
        `${parameter.role}\u0000${parameter.module_id}\u0000${parameter.parameter}`,
        parameter
    ]));
    const orderedSchema = radixSortUtf8([...orderSchema.keys()]).map(key => orderSchema.get(key)!);
    const abilityParameterizedViews = radixSortUtf8(options.views
        .filter(view => schemaParameterCapabilities('view', view.viewId, view.schema)
            .some(capability => capability.dimension === 'Ability'))
        .map(view => view.viewId));

    const findingOrder = new Map(findings.map(entry => [entry.id, entry]));
    return {
        schema_version: LABEL_ARCHITECTURE_AUDIT_SCHEMA_VERSION,
        spec: options.specName,
        matching: {
            source: matching.source,
            graph_reuse_reason: matching.reason,
            targets: options.targets.length,
            compatible_pairs: pairIndex.orderedPairs.length,
            matched_tuples: tuples.length
        },
        target_dimensions: {
            cardinality: {
                Area: cardinality(options.targets, 'Area'),
                Scope: cardinality(options.targets, 'Scope'),
                Ability: cardinality(options.targets, 'Ability')
            },
            without_area: targetIdsByDimensionCount(options.targets, 'Area', count => count === 0),
            without_scope: targetIdsByDimensionCount(options.targets, 'Scope', count => count === 0),
            without_ability: targetIdsByDimensionCount(options.targets, 'Ability', count => count === 0),
            multiple_area: targetIdsByDimensionCount(options.targets, 'Area', count => count > 1),
            multiple_scope: targetIdsByDimensionCount(options.targets, 'Scope', count => count > 1),
            multiple_ability: targetIdsByDimensionCount(options.targets, 'Ability', count => count > 1)
        },
        module_inventory: {
            generators: options.generators.length,
            views: options.views.length,
            generator_schema_parameters: orderedSchema.filter(parameter => parameter.role === 'generator').length,
            view_schema_parameters: orderedSchema.filter(parameter => parameter.role === 'view').length,
            ability_parameterized_views: abilityParameterizedViews,
            views_with_required_labels: radixSortUtf8(options.views
                .filter(view => (view.requiredLabels ?? []).length > 0).map(view => view.viewId)),
            views_with_rejected_labels: radixSortUtf8(options.views
                .filter(view => (view.rejectedLabels ?? []).length > 0).map(view => view.viewId)),
            views_with_positive_areas: radixSortUtf8(options.views
                .filter(view => (viewCaps.get(view.viewId) ?? [])
                    .some(capability => capability.dimension === 'Area'))
                .map(view => view.viewId))
        },
        schema_parameters: orderedSchema,
        capability_provenance: provenanceForTuples({
            tuples,
            generators: options.generators,
            views: options.views,
            counters
        }),
        source_signals: sourceSignals,
        findings: radixSortUtf8([...findingOrder.keys()]).map(key => findingOrder.get(key)!),
        work: counters.snapshot()
    };
}

export function formatLabelArchitectureAudit(report: LabelArchitectureAuditReport): string {
    const findingCounts = new Map<string, number>();
    for (const finding of report.findings) {
        const key = `${finding.disposition}:${finding.category}`;
        findingCounts.set(key, (findingCounts.get(key) ?? 0) + 1);
    }
    const lines = [
        `# Label architecture audit: ${report.spec}`,
        '',
        '## Matching source',
        '',
        `- Source: \`${report.matching.source}\``,
        `- Reason: ${report.matching.graph_reuse_reason}`,
        `- Targets: ${report.matching.targets}`,
        `- Compatible generator/view pairs: ${report.matching.compatible_pairs}`,
        `- Matched target/pair tuples: ${report.matching.matched_tuples}`,
        '',
        '## Target dimensions',
        '',
        '| Dimension | Cardinality distribution | Missing | Multiple |',
        '| --- | --- | ---: | ---: |',
        `| Area | ${JSON.stringify(report.target_dimensions.cardinality.Area)} | ${report.target_dimensions.without_area.length} | ${report.target_dimensions.multiple_area.length} |`,
        `| Scope | ${JSON.stringify(report.target_dimensions.cardinality.Scope)} | ${report.target_dimensions.without_scope.length} | ${report.target_dimensions.multiple_scope.length} |`,
        `| Ability | ${JSON.stringify(report.target_dimensions.cardinality.Ability)} | ${report.target_dimensions.without_ability.length} | ${report.target_dimensions.multiple_ability.length} |`,
        '',
        '## Module inventory',
        '',
        `- Generators: ${report.module_inventory.generators}`,
        `- Views: ${report.module_inventory.views}`,
        `- Generator schema parameters: ${report.module_inventory.generator_schema_parameters}`,
        `- View schema parameters: ${report.module_inventory.view_schema_parameters}`,
        `- Ability-parameterized views: ${report.module_inventory.ability_parameterized_views.length}`,
        `- Views with required labels: ${report.module_inventory.views_with_required_labels.length}`,
        `- Views with rejected labels: ${report.module_inventory.views_with_rejected_labels.length}`,
        `- Views with positive Areas: ${report.module_inventory.views_with_positive_areas.length}`,
        '',
        '## Finding summary',
        '',
        '| Disposition | Category | Findings |',
        '| --- | --- | ---: |',
        ...radixSortUtf8([...findingCounts.keys()]).map(key => {
            const [disposition, category] = key.split(':');
            return `| ${disposition} | ${category} | ${findingCounts.get(key)} |`;
        }),
        '',
        '## Work counters',
        '',
        '```json',
        JSON.stringify(report.work),
        '```',
        '',
        '## Findings',
        ''
    ];
    for (const finding of report.findings) {
        lines.push(
            `### ${finding.id}`,
            '',
            `- Disposition: ${finding.disposition}`,
            `- Category: ${finding.category}`,
            `- Summary: ${finding.summary}`,
            `- Modules: ${finding.modules.join(', ') || '—'}`,
            `- Labels: ${finding.labels.map(shortenLabel).join(', ') || '—'}`,
            `- Files: ${finding.files.join(', ') || '—'}`,
            `- Affected production tuples: ${finding.affected_tuple_count}`,
            ''
        );
    }
    lines.push(
        '## Exact provenance artifact',
        '',
        'The sibling JSON report contains every matched target label, its exact generator/view',
        'provider capability, declaration source, and every affected tuple attached to each finding.',
        ''
    );
    return lines.join('\n');
}
