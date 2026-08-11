import type {
    BacklogTask,
    Cluster,
    CoverageData,
    Domain,
    GradesTree,
    StandardCoverage,
    StandardNode,
    TaskType,
} from './types.ts';
import {
    assetIndexSampleMap,
    buildHuggingFaceAssetUrl,
    requestedLabelKey,
    type AssetIndex,
    type ReleasedAssetSample,
} from '../lib/asset-index.ts';

export type CoverageKind = 'analysis' | 'beyond' | 'ontology' | 'partial' | 'covered' | 'implementation';

export const gradeNameFromId = (id: string): string => {
    const first = id.split('.')[0];
    if (first.startsWith('HS') || /^[NAFGS]-/.test(first)) return 'High School';
    if (first === 'K') return 'Kindergarten';
    if (/^[1-8]$/.test(first)) return `Grade ${first}`;
    return 'Other';
};

export const getDomains = (tree: GradesTree, grade: string): Domain[] => {
    const domains = new Map<string, Domain>();
    Object.values(tree[grade] ?? {}).forEach(group => {
        Object.entries(group.domains ?? {}).forEach(([domainId, domain]) => {
            if (!domains.has(domainId)) domains.set(domainId, domain);
        });
    });
    return [...domains.values()];
};

export const getClusters = (tree: GradesTree, grade: string, domainId: string | null): Cluster[] =>
    getDomains(tree, grade)
        .filter(domain => !domainId || domain.id === domainId)
        .flatMap(domain => domain.clusters ?? []);

export const getCoverageKind = (coverage: StandardCoverage): CoverageKind => {
    if (!coverage.spec_covered) return 'analysis';
    if (coverage.fully_beyond_scope) return 'beyond';
    if (!coverage.ontology_covered || coverage.ontology_todos.length > 0) return 'ontology';
    if (coverage.dataset_covered && coverage.partially_beyond_scope) return 'partial';
    if (coverage.dataset_covered) return 'covered';
    return 'implementation';
};

export const getSearchCoverageKind = (coverage: StandardCoverage): CoverageKind => {
    if (coverage.fully_beyond_scope) return 'beyond';
    if (coverage.dataset_covered && coverage.partially_beyond_scope) return 'partial';
    if (coverage.dataset_covered) return 'covered';
    if (coverage.ontology_covered) return 'implementation';
    return 'ontology';
};

export const searchStandards = (
    standardsMap: Record<string, StandardNode>,
    query: string,
): StandardNode[] => {
    const normalizedQuery = query.toLowerCase().trim();
    return Object.values(standardsMap).filter(standard => {
        if (standard.level.toLowerCase() !== 'standard') return false;
        if (!normalizedQuery) return true;
        return standard.id.toLowerCase().includes(normalizedQuery)
            || standard.description.toLowerCase().includes(normalizedQuery);
    });
};

export const matchesTaskGrade = (task: BacklogTask, gradeName: string): boolean => {
    const gradeCode = gradeName === 'Kindergarten'
        ? 'K'
        : gradeName === 'High School'
            ? 'HS'
            : gradeName.replace('Grade ', '').trim();

    return task.standards.some(standardId => {
        const first = standardId.split('.')[0];
        if (gradeCode === 'K') return first === 'K';
        if (gradeCode === 'HS') return first.startsWith('HS') || /^[NAFGS]-/.test(first);
        return first === gradeCode;
    });
};

export const filterTasks = (
    tasks: BacklogTask[],
    grade: string,
    taskType: TaskType | null,
): BacklogTask[] => tasks.filter(task =>
    matchesTaskGrade(task, grade) && (!taskType || task.type === taskType),
);

export const calculateStats = (coverageData: CoverageData | null) => {
    const metadata = coverageData?.metadata;
    const leafCount = metadata?.total_leaves_scanned ?? 0;
    const coveredCount = metadata?.covered_count ?? 0;
    return {
        coverage: `${leafCount > 0 ? Math.round((coveredCount / leafCount) * 100) : 0}% (${coveredCount})`,
        missingImplementation: metadata?.missing_generator_count ?? 0,
        missingOntology: metadata?.missing_ontology_count ?? 0,
        analysisNeeded: metadata?.analysis_needed_count ?? 0,
        leafStandards: leafCount,
    };
};

export const getLabelSets = (coverage: StandardCoverage): string[][] => [
    ...coverage.competencies,
    ...coverage.implementation_todos.map(todo => todo.labels),
];

export const intersectLabels = (sets: string[][]): string[] => {
    if (sets.length === 0) return [];
    return sets[0].filter(label => sets.every(set => set.includes(label)));
};

export const findReleasedSamples = (
    index: AssetIndex | null,
    labels: readonly string[],
): ReleasedAssetSample[] => {
    if (!index) return [];
    return assetIndexSampleMap(index).get(requestedLabelKey(labels))?.samples ?? [];
};

export const releasedSampleUrl = (
    index: AssetIndex,
    sample: ReleasedAssetSample,
): string => buildHuggingFaceAssetUrl(index.dataset, sample);
