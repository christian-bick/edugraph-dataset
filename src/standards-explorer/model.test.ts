import { describe, expect, it } from 'vitest';
import {
    calculateStats,
    filterTasks,
    findReleasedSamples,
    findReleasedSamplesForLabelSets,
    getClusters,
    getCoverageKind,
    getCoverageModules,
    getDomains,
    getSearchCoverageKind,
    hasReleasedSamplesForEveryPermutation,
    getScopeKind,
    gradeNameFromId,
    intersectLabels,
    matchesTaskGrade,
    sampleAssetUrl,
    searchStandards,
} from './model.ts';
import type {
    BacklogTask,
    CoverageData,
    Domain,
    GradesTree,
    StandardCoverage,
    StandardNode,
} from './types.ts';
import type { AssetIndex } from '../lib/asset-index.ts';

const createCoverage = (overrides: Partial<StandardCoverage> = {}): StandardCoverage => ({
    id: 'K.CC.A.1',
    spec_covered: true,
    ontology_covered: true,
    competencies: [],
    implementation_todos: [],
    ontology_todos: [],
    beyond_scope: [],
    fully_beyond_scope: false,
    partially_beyond_scope: false,
    matched_areas: [],
    matched_scopes: [],
    matched_abilities: [],
    reasoning: '',
    suggested_task: null,
    dataset_covered: false,
    generator_module: null,
    cluster_id: 'K.CC.A',
    ...overrides,
});

const releasedIndex: AssetIndex = {
    schema_version: 1,
    generated_at: 'fixed',
    dataset: { repository: 'owner/dataset', revision: 'v1' },
    label_sets: [{
        requested_labels: ['Area'],
        samples: [{
            split: 'train',
            file_name: 'sample.png',
            generator: 'generator',
            view: 'view',
            mode: 'question',
        }],
    }],
};

const createTask = (standards: string[], type: BacklogTask['type'] = 'ANALYSIS'): BacklogTask => ({
    id: `task-${standards[0]}`,
    type,
    cluster_id: standards[0],
    cluster_description: 'Cluster',
    title: 'Task',
    description: 'Description',
    standards,
});

const pendingImplementationTodo = {
    id: 'K.CC.A.1-pending',
    labels: ['Pending'],
    explanation: 'Pending implementation',
    implementation: {
        id: 'pending-implementation',
        description: 'Pending implementation',
        generators: [],
        views: [],
    },
};

describe('standards explorer model', () => {
    it('maps standard prefixes to explorer grade names', () => {
        expect(gradeNameFromId('K.CC.A.1')).toBe('Kindergarten');
        expect(gradeNameFromId('4.NF.A.1')).toBe('Grade 4');
        expect(gradeNameFromId('HSN-RN.A.1')).toBe('High School');
        expect(gradeNameFromId('N-RN.A.1')).toBe('High School');
        expect(gradeNameFromId('OTHER')).toBe('Other');
    });

    it('flattens grade domains without duplicating domain ids', () => {
        const firstDomain: Domain = { id: 'K.CC', name: 'Counting', clusters: [] };
        const secondDomain: Domain = { id: 'K.G', name: 'Geometry', clusters: [] };
        const tree: GradesTree = {
            Kindergarten: {
                First: { description: '', domains: { 'K.CC': firstDomain } },
                Second: { description: '', domains: { 'K.CC': firstDomain, 'K.G': secondDomain } },
            },
        };

        expect(getDomains(tree, 'Kindergarten')).toEqual([firstDomain, secondDomain]);
        expect(getDomains(tree, 'Grade 8')).toEqual([]);
    });

    it('filters flattened clusters by domain', () => {
        const tree: GradesTree = {
            Kindergarten: {
                Group: {
                    description: '',
                    domains: {
                        'K.CC': { id: 'K.CC', name: '', clusters: [{ id: 'K.CC.A', description: '', cluster_type: 'major', standards: [] }] },
                        'K.G': { id: 'K.G', name: '', clusters: [{ id: 'K.G.A', description: '', cluster_type: 'major', standards: [] }] },
                    },
                },
            },
        };

        expect(getClusters(tree, 'Kindergarten', null).map(cluster => cluster.id)).toEqual(['K.CC.A', 'K.G.A']);
        expect(getClusters(tree, 'Kindergarten', 'K.G').map(cluster => cluster.id)).toEqual(['K.G.A']);
    });

    it('distinguishes ready content from fully released permutations', () => {
        expect(getCoverageKind(createCoverage({ spec_covered: false }))).toBe('analysis');
        expect(getCoverageKind(createCoverage({ fully_beyond_scope: true }))).toBe('beyond');
        expect(getCoverageKind(createCoverage({ ontology_covered: false }))).toBe('ontology');
        expect(getCoverageKind(createCoverage({
            dataset_covered: true,
            partially_beyond_scope: true,
            competencies: [['Area']],
        }), releasedIndex)).toBe('released');
        expect(getCoverageKind(createCoverage({
            dataset_covered: true,
            implementation_todos: [pendingImplementationTodo],
        }))).toBe('partial');
        expect(getCoverageKind(createCoverage({
            dataset_covered: true,
            competencies: [['Area'], ['Missing']],
        }), releasedIndex)).toBe('ready');
        expect(getCoverageKind(createCoverage({ dataset_covered: true }))).toBe('ready');
        expect(getCoverageKind(createCoverage())).toBe('implementation');
        expect(hasReleasedSamplesForEveryPermutation(createCoverage({
            competencies: [['Area']],
        }), releasedIndex)).toBe(true);
    });

    it('uses the same partial implementation status in search results', () => {
        expect(getSearchCoverageKind(createCoverage({ fully_beyond_scope: true }))).toBe('beyond');
        expect(getSearchCoverageKind(createCoverage({
            dataset_covered: true,
            partially_beyond_scope: true,
            competencies: [['Area']],
        }), releasedIndex)).toBe('released');
        expect(getSearchCoverageKind(createCoverage({
            dataset_covered: true,
            implementation_todos: [pendingImplementationTodo],
        }))).toBe('partial');
        expect(getSearchCoverageKind(createCoverage({ dataset_covered: true }))).toBe('ready');
        expect(getSearchCoverageKind(createCoverage({ ontology_covered: true }))).toBe('implementation');
        expect(getSearchCoverageKind(createCoverage({ ontology_covered: false }))).toBe('ontology');
    });

    it('tracks scope independently from implementation coverage', () => {
        expect(getScopeKind(createCoverage())).toBe('in-scope');
        expect(getScopeKind(createCoverage({ partially_beyond_scope: true }))).toBe('partially-in-scope');
        expect(getScopeKind(createCoverage({
            fully_beyond_scope: true,
            partially_beyond_scope: true,
        }))).toBe('beyond-scope');

        const mixedCoverage = createCoverage({
            dataset_covered: true,
            partially_beyond_scope: true,
            implementation_todos: [pendingImplementationTodo],
        });
        expect(getCoverageKind(mixedCoverage)).toBe('partial');
        expect(getScopeKind(mixedCoverage)).toBe('partially-in-scope');
    });

    it('searches only standard-level nodes by id or description', () => {
        const standards: Record<string, StandardNode> = {
            'K.CC.A.1': { id: 'K.CC.A.1', description: 'Count by tens', level: 'Standard', aspects: [], modeling: false },
            '1.NBT.A.1': { id: '1.NBT.A.1', description: 'Place value', level: 'Standard', aspects: [], modeling: false },
            'K.CC.A': { id: 'K.CC.A', description: 'Count sequence', level: 'Cluster', aspects: [], modeling: false },
        };

        expect(searchStandards(standards, 'tens').map(standard => standard.id)).toEqual(['K.CC.A.1']);
        expect(searchStandards(standards, '1.nbt').map(standard => standard.id)).toEqual(['1.NBT.A.1']);
    });

    it('matches and filters backlog tasks by grade and task type', () => {
        const tasks = [
            createTask(['K.CC.A.1']),
            createTask(['2.OA.A.1']),
            createTask(['N-RN.A.1'], 'ONTOLOGY_EXTENSION'),
        ];

        expect(matchesTaskGrade(tasks[0], 'Kindergarten')).toBe(true);
        expect(matchesTaskGrade(tasks[2], 'High School')).toBe(true);
        expect(filterTasks(tasks, 'Grade 2', null)).toEqual([tasks[1]]);
        expect(filterTasks(tasks, 'High School', 'ANALYSIS')).toEqual([]);
    });

    it('calculates display statistics and common labels', () => {
        const coverageData = {
            metadata: {
                total_leaves_scanned: 467,
                covered_count: 46,
                missing_generator_count: 2,
                missing_ontology_count: 3,
                analysis_needed_count: 420,
            },
        } as CoverageData;

        expect(calculateStats(coverageData)).toEqual({
            coverage: '10% (46)',
            missingImplementation: 2,
            missingOntology: 3,
            analysisNeeded: 420,
            leafStandards: 467,
        });
        expect(intersectLabels([['Area', 'Scope A'], ['Area', 'Scope B']])).toEqual(['Area']);
        expect(intersectLabels([])).toEqual([]);
    });

    it('finds only exact released label-set matches and constructs their URL', () => {
        const index: AssetIndex = {
            schema_version: 1,
            generated_at: 'fixed',
            dataset: { repository: 'owner/dataset', revision: 'v1' },
            label_sets: [{
                requested_labels: ['Area', 'Scope'],
                samples: [{
                    split: 'train',
                    file_name: 'module/image.png',
                    generator: 'generator',
                    view: 'view',
                    mode: 'question',
                }],
            }],
        };

        const samples = findReleasedSamples(index, ['Scope', 'Area']);
        expect(samples).toHaveLength(1);
        expect(findReleasedSamples(index, ['Area'])).toEqual([]);
        expect(findReleasedSamples(null, ['Area', 'Scope'])).toEqual([]);
        expect(sampleAssetUrl(index, samples[0])).toBe(
            'https://huggingface.co/datasets/owner/dataset/resolve/v1/train/module/image.png',
        );
        expect(sampleAssetUrl(index, samples[0], 'local')).toBe(
            '/dataset/local/train/module/image.png',
        );
        expect(getCoverageModules(createCoverage({
            competencies: [['Area', 'Scope']],
            generator_module: 'generator, fallback-generator',
        }), index)).toEqual([
            { kind: 'generator', name: 'generator' },
            { kind: 'generator', name: 'fallback-generator' },
            { kind: 'view', name: 'view' },
        ]);
        expect(getCoverageModules(createCoverage({ generator_module: 'first, second' }), null)).toEqual([
            { kind: 'generator', name: 'first' },
            { kind: 'generator', name: 'second' },
        ]);
    });

    it('aggregates label-set samples in order without duplicate released files', () => {
        const first = {
            split: 'train' as const,
            file_name: 'first.png',
            generator: 'generator',
            view: 'view',
            mode: 'question' as const,
        };
        const second = { ...first, split: 'validation' as const, file_name: 'second.png' };
        const index: AssetIndex = {
            schema_version: 1,
            generated_at: 'fixed',
            dataset: { repository: 'owner/dataset', revision: 'v1' },
            label_sets: [
                { requested_labels: ['First'], samples: [first] },
                { requested_labels: ['Second'], samples: [first, second] },
            ],
        };

        expect(findReleasedSamplesForLabelSets(index, [['First'], ['Second']]))
            .toEqual([first, second]);
        expect(findReleasedSamplesForLabelSets(null, [['First']])).toEqual([]);
    });
});
