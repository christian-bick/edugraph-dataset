import {Ability, Area, Scope} from 'edugraph-ts';
import {
    computeSampleKey,
    generateSampleWithRetry,
    loadGeneratorCatalog,
    loadSpecTodos,
    loadTargets,
    loadViewCatalog,
    matchTargets,
    type GeneratorCatalogEntry,
    type ViewCatalogEntry
} from './generation.ts';
import {groupOntologyTodos} from './ontology-todo.ts';
import {
    assetIndexSampleMap,
    requestedLabelKey,
    type AssetIndex
} from './asset-index.ts';
import type {
    BeyondScopeEntry,
    CompetencyTarget,
    ImplementationTodo as EngineImplementationTodo,
    OntologyTodo as EngineOntologyTodo
} from '../types/ml-engine.ts';
import type {
    BacklogTask,
    CoverageData,
    CoverageManifest,
    Implementation,
    ImplementationTodo,
    NamedTodo,
    OntologyPackage,
    OntologyTodo,
    StandardCoverage,
    StandardNode,
    StandardsTreeData
} from '../standards-explorer/types.ts';

export interface StandardsCoverageSource {
    targets: CompetencyTarget[];
    implementationTodos: EngineImplementationTodo[];
    ontologyTodos: EngineOntologyTodo[];
    beyondScope: BeyondScopeEntry[];
}

export interface BuildStandardsCoverageOptions {
    standardsMap: Record<string, StandardNode>;
    source: StandardsCoverageSource;
    ontologyVersion: string;
    resolveGenerator: (target: CompetencyTarget) => string | null;
    generatedAt?: string;
    grade?: string;
    excludeHighSchool?: boolean;
}

export interface BuildCurrentStandardsCoverageOptions {
    standardsMap: Record<string, StandardNode>;
    ontologyVersion: string;
    generatedAt?: string;
    grade?: string;
    excludeHighSchool?: boolean;
    knownAssets?: AssetIndex;
}

export interface BuildCoverageManifestOptions {
    channel: CoverageManifest['channel'];
    sourceRef: string;
    sourceSha: string;
    ontologyVersion: string;
    generatedAt: string;
}

const isHighSchool = (id: string): boolean => {
    const first = id.split('.')[0];
    return first.startsWith('HS') || /^[NAFGS]-/.test(first);
};

const matchesGrade = (id: string, grade?: string): boolean => {
    if (!grade) return true;
    const first = id.split('.')[0];
    const normalized = grade.toLowerCase().trim();
    if (normalized === 'k' || normalized === 'kindergarten') return first === 'K';
    if (normalized === 'hs' || normalized === 'high school') return isHighSchool(id);
    return first === grade || `grade ${first}`.toLowerCase() === normalized;
};

const leafStandards = (
    standardsMap: Record<string, StandardNode>,
    grade?: string,
    excludeHighSchool = false
): StandardNode[] => Object.values(standardsMap).filter(standard =>
    Array.isArray(standard.children)
    && standard.children.length === 0
    && (!excludeHighSchool || !isHighSchool(standard.id))
    && matchesGrade(standard.id, grade));

export function findParentClusterId(
    standardId: string,
    standardsMap: Record<string, StandardNode>
): string {
    let current = standardsMap[standardId];
    while (current && current.level.toLowerCase() !== 'cluster') {
        if (!current.parent) break;
        current = standardsMap[current.parent];
    }
    return current?.id ?? 'Other';
}

export function findStandardIdForTarget(
    targetId: string,
    sortedLeafIds: readonly string[]
): string | null {
    return sortedLeafIds.find(standardId =>
        targetId === standardId || targetId.startsWith(`${standardId}-`)) ?? null;
}

const cloneImplementation = (implementation: EngineImplementationTodo['implementation']): Implementation => ({
    id: implementation.id,
    description: implementation.description,
    generators: implementation.generators.map(module => ({...module})),
    views: implementation.views.map(module => ({...module}))
});

const cloneOntology = (ontology: EngineOntologyTodo['ontology']): OntologyPackage => ({
    id: ontology.id,
    description: ontology.description,
    changes: ontology.changes.map(change => ({
        dimension: change.dimension,
        entities: [...change.entities]
    }))
});

const buildImplementationTodo = (todo: EngineImplementationTodo): ImplementationTodo => ({
    id: todo.id,
    labels: [...todo.labels],
    explanation: todo.explanation ?? '',
    implementation: cloneImplementation(todo.implementation)
});

const buildOntologyTodo = (todo: EngineOntologyTodo): OntologyTodo => ({
    title: todo.title,
    description: todo.description,
    ontology: cloneOntology(todo.ontology)
});

const buildNamedTodo = (todo: BeyondScopeEntry): NamedTodo => ({
    title: todo.title,
    description: todo.description
});

const buildCoverageEntry = ({
    standard,
    standardsMap,
    sortedLeafIds,
    source,
    resolveGenerator
}: {
    standard: StandardNode;
    standardsMap: Record<string, StandardNode>;
    sortedLeafIds: readonly string[];
    source: StandardsCoverageSource;
    resolveGenerator: BuildStandardsCoverageOptions['resolveGenerator'];
}): StandardCoverage => {
    const belongsToStandard = (target: {id: string}) =>
        findStandardIdForTarget(target.id, sortedLeafIds) === standard.id;
    const targets = source.targets.filter(belongsToStandard);
    const implementationTodos = source.implementationTodos
        .filter(belongsToStandard)
        .map(buildImplementationTodo);
    const ontologyTodos = source.ontologyTodos
        .filter(todo => todo.standardId === standard.id)
        .map(buildOntologyTodo);
    const beyondScope = source.beyondScope
        .filter(todo => todo.standardId === standard.id)
        .map(buildNamedTodo);
    const competencies = targets.map(target => [...target.labels]);
    const specCovered = targets.length > 0
        || implementationTodos.length > 0
        || ontologyTodos.length > 0
        || beyondScope.length > 0;
    const fullyBeyondScope = beyondScope.length > 0
        && targets.length === 0
        && implementationTodos.length === 0
        && ontologyTodos.length === 0;
    const partiallyBeyondScope = beyondScope.length > 0 && !fullyBeyondScope;
    const labels = [...competencies.flat(), ...implementationTodos.flatMap(todo => todo.labels)];
    const uniqueLabels = [...new Set(labels)];
    const generatorModules = targets.map(resolveGenerator);
    const matchedGenerators = generatorModules.filter((module): module is string => module !== null);

    return {
        id: standard.id,
        spec_covered: specCovered,
        ontology_covered: specCovered
            && ontologyTodos.length === 0
            && (competencies.length > 0 || implementationTodos.length > 0 || beyondScope.length > 0),
        competencies,
        implementation_todos: implementationTodos,
        ontology_todos: ontologyTodos,
        beyond_scope: beyondScope,
        fully_beyond_scope: fullyBeyondScope,
        partially_beyond_scope: partiallyBeyondScope,
        matched_areas: uniqueLabels.filter(label => Object.values(Area).includes(label as Area)),
        matched_scopes: uniqueLabels.filter(label => Object.values(Scope).includes(label as Scope)),
        matched_abilities: uniqueLabels.filter(label => Object.values(Ability).includes(label as Ability)),
        reasoning: specCovered ? '' : 'Spec file not yet created for this grade.',
        suggested_task: specCovered
            ? null
            : {title: 'Analyze Standard', description: 'Domain analysis required to define target competencies.'},
        dataset_covered: targets.length > 0 && matchedGenerators.length === targets.length,
        generator_module: matchedGenerators.length > 0 ? [...new Set(matchedGenerators)].join(', ') : null,
        cluster_id: findParentClusterId(standard.id, standardsMap)
    };
};

const buildImplementationTasks = (
    todos: EngineImplementationTodo[],
    sortedLeafIds: readonly string[],
    standardsMap: Record<string, StandardNode>
): BacklogTask[] => {
    const grouped = new Map<string, EngineImplementationTodo[]>();
    for (const todo of todos) {
        const group = grouped.get(todo.implementation.id) ?? [];
        group.push(todo);
        grouped.set(todo.implementation.id, group);
    }

    return [...grouped.values()].map(targets => {
        const implementation = targets[0].implementation;
        const standards = [...new Set(targets
            .map(target => findStandardIdForTarget(target.id, sortedLeafIds))
            .filter((standardId): standardId is string => standardId !== null))];
        const clusterIds = [...new Set(standards.map(standardId =>
            findParentClusterId(standardId, standardsMap)))];
        const details = [...new Map(targets.map(target => [
            target.id.split('~')[0],
            `- ${target.id.split('~')[0]}: ${target.explanation || 'Implement the missing generator/view path.'}`
        ])).values()];
        return {
            id: `task-implementation-${implementation.id}`,
            type: 'DATASET_ENRICHMENT' as const,
            cluster_id: clusterIds.join(', '),
            cluster_description: clusterIds
                .map(clusterId => standardsMap[clusterId]?.description || 'Other Math Concepts')
                .join(' / '),
            title: implementation.id,
            description: `${implementation.description}\nTargets:\n${details.join('\n')}`,
            standards,
            implementation: cloneImplementation(implementation)
        };
    });
};

const buildOntologyTasks = (
    todos: EngineOntologyTodo[],
    standardsMap: Record<string, StandardNode>
): BacklogTask[] => groupOntologyTodos(todos).map(({ontology, todos: groupedTodos}) => {
    const standards = [...new Set(groupedTodos.map(todo => todo.standardId))];
    const clusterIds = [...new Set(standards.map(standardId =>
        findParentClusterId(standardId, standardsMap)))];
    const details = groupedTodos.map(todo =>
        `- ${todo.standardId} — ${todo.title}: ${todo.description}`);
    return {
        id: `task-ontology-${ontology.id}`,
        type: 'ONTOLOGY_EXTENSION' as const,
        cluster_id: clusterIds.join(', '),
        cluster_description: clusterIds
            .map(clusterId => standardsMap[clusterId]?.description || 'Other Math Concepts')
            .join(' / '),
        title: ontology.id,
        description: `${ontology.description}\nTargets:\n${details.join('\n')}`,
        standards,
        ontology: cloneOntology(ontology)
    };
});

const buildAnalysisTasks = (
    coverage: Record<string, StandardCoverage>,
    standardsMap: Record<string, StandardNode>
): BacklogTask[] => {
    const byCluster = new Map<string, StandardCoverage[]>();
    for (const entry of Object.values(coverage)) {
        if (entry.fully_beyond_scope
            || (entry.spec_covered
                && entry.ontology_covered
                && entry.dataset_covered
                && entry.ontology_todos.length === 0
                && entry.implementation_todos.length === 0)) continue;
        const group = byCluster.get(entry.cluster_id) ?? [];
        group.push(entry);
        byCluster.set(entry.cluster_id, group);
    }

    const tasks: BacklogTask[] = [];
    for (const [clusterId, entries] of byCluster) {
        const missingGenerator = entries.filter(entry =>
            entry.spec_covered
            && entry.ontology_todos.length === 0
            && entry.implementation_todos.length === 0
            && !entry.dataset_covered);
        if (missingGenerator.length > 0) {
            tasks.push({
                id: `task-generator-${clusterId}`,
                type: 'DATASET_ENRICHMENT',
                cluster_id: clusterId,
                cluster_description: standardsMap[clusterId]?.description || 'Other Math Concepts',
                title: `Generate Dataset for ${clusterId}`,
                description: `Implement/extend generators and views to cover: ${missingGenerator.map(entry => entry.id).join(', ')}. Details:\n${missingGenerator.map(entry => `- ${entry.id}: Implement generator/view for missing competencies`).join('\n')}`,
                standards: missingGenerator.map(entry => entry.id)
            });
        }

        const uncovered = entries.filter(entry => !entry.spec_covered);
        if (uncovered.length > 0) {
            tasks.push({
                id: `task-analysis-${clusterId}`,
                type: 'ANALYSIS',
                cluster_id: clusterId,
                cluster_description: standardsMap[clusterId]?.description || 'Other Math Concepts',
                title: `Perform Analysis for ${clusterId}`,
                description: `Perform domain analysis and write spec file for: ${uncovered.map(entry => entry.id).join(', ')}.`,
                standards: uncovered.map(entry => entry.id)
            });
        }
    }
    return tasks;
};

export function buildStandardsCoverage({
    standardsMap,
    source,
    ontologyVersion,
    resolveGenerator,
    generatedAt = new Date().toISOString(),
    grade,
    excludeHighSchool = false
}: BuildStandardsCoverageOptions): CoverageData {
    const leaves = leafStandards(standardsMap, grade, excludeHighSchool);
    const sortedLeafIds = leaves.map(standard => standard.id).sort((left, right) => right.length - left.length);
    const coverage = Object.fromEntries(leaves.map(standard => [
        standard.id,
        buildCoverageEntry({standard, standardsMap, sortedLeafIds, source, resolveGenerator})
    ]));
    const entries = Object.values(coverage);

    return {
        metadata: {
            generated_at: generatedAt,
            ontology_version: ontologyVersion,
            total_leaves_scanned: leaves.length,
            spec_covered_count: entries.filter(entry => entry.spec_covered).length,
            covered_count: entries.filter(entry =>
                entry.dataset_covered
                && !entry.partially_beyond_scope
                && entry.implementation_todos.length === 0).length,
            missing_generator_count: entries.filter(entry =>
                !entry.fully_beyond_scope
                && entry.spec_covered
                && entry.ontology_todos.length === 0
                && (entry.implementation_todos.length > 0 || !entry.dataset_covered)).length,
            missing_ontology_count: entries.filter(entry =>
                entry.spec_covered && entry.ontology_todos.length > 0).length,
            analysis_needed_count: entries.filter(entry => !entry.spec_covered).length,
            beyond_scope_count: entries.filter(entry => entry.beyond_scope.length > 0).length,
            fully_beyond_scope_count: entries.filter(entry => entry.fully_beyond_scope).length
        },
        coverage,
        tasks: [
            ...buildImplementationTasks(source.implementationTodos, sortedLeafIds, standardsMap),
            ...buildOntologyTasks(source.ontologyTodos, standardsMap),
            ...buildAnalysisTasks(coverage, standardsMap)
        ]
    };
}

const resolveGeneratorForTarget = (
    target: CompetencyTarget,
    generators: GeneratorCatalogEntry[],
    views: ViewCatalogEntry[]
): string | null => {
    const {tuples} = matchTargets([target], generators, views);
    for (const tuple of tuples) {
        const generator = generators.find(entry => entry.generatorId === tuple.generatorId)?.generator;
        if (!generator) continue;
        const sampleKey = computeSampleKey({
            targetId: target.id,
            generatorId: tuple.generatorId,
            viewId: tuple.viewId,
            split: 'train',
            mode: 'question',
            instanceIdx: 0
        });
        try {
            const {stub} = generateSampleWithRetry({
                generator,
                labels: [...target.labels],
                sampleKey,
                maxAttempts: 10
            });
            if (stub) return tuple.generatorId;
        } catch {
            // Try the next semantically matched tuple.
        }
    }
    return null;
};

export async function buildCurrentStandardsCoverage(
    options: BuildCurrentStandardsCoverageOptions
): Promise<CoverageData> {
    const [targets, todos, generators, views] = await Promise.all([
        loadTargets('ccss'),
        loadSpecTodos('ccss'),
        loadGeneratorCatalog(),
        loadViewCatalog()
    ]);
    const knownSamples = options.knownAssets
        ? assetIndexSampleMap(options.knownAssets)
        : new Map();
    return buildStandardsCoverage({
        ...options,
        source: {
            targets,
            implementationTodos: todos.implementationTodos,
            ontologyTodos: todos.ontologyTodos,
            beyondScope: todos.beyondScope
        },
        resolveGenerator: target => {
            const generatedSample = knownSamples.get(requestedLabelKey(target.labels))?.samples[0];
            return generatedSample?.generator
                ?? resolveGeneratorForTarget(target, generators, views);
        }
    });
}

export function buildCoverageManifest({
    channel,
    sourceRef,
    sourceSha,
    ontologyVersion,
    generatedAt
}: BuildCoverageManifestOptions): CoverageManifest {
    return {
        schema_version: 2,
        channel,
        source_ref: sourceRef,
        source_sha: sourceSha,
        generated_at: generatedAt,
        ontology_version: ontologyVersion
    };
}

export function resolveOntologyVersion(packageJson: {dependencies?: Record<string, string>}): string {
    const dependency = packageJson.dependencies?.['edugraph-ts'] ?? '';
    return dependency.match(/\/releases\/download\/(v[\d.]+)\//)?.[1] ?? 'unknown';
}

export function parseStandardsTree(value: unknown): StandardsTreeData {
    if (!value || typeof value !== 'object') throw new Error('Standards tree data must be an object.');
    const tree = value as Partial<StandardsTreeData>;
    if (!tree.tree || !tree.standardsMap) throw new Error('Standards tree data is incomplete.');
    return tree as StandardsTreeData;
}
