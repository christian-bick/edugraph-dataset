import {Ability, Area, Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import type {
    BeyondScopeEntry,
    CompetencyTarget,
    ImplementationTodo,
    OntologyTodo
} from '../types/ml-engine.ts';
import type {StandardNode} from '../standards-explorer/types.ts';
import {
    buildCoverageManifest,
    buildStandardsCoverage,
    findParentClusterId,
    findStandardIdForTarget,
    parseStandardsTree
} from './standards-coverage.ts';
import {createWorkCounters} from './work-counters.ts';
import type {CoverageInputIdentity} from './coverage-identity.ts';

const coverageInputs: CoverageInputIdentity = {
    schema_version: 1,
    producer_epoch: 'standards-coverage-v1',
    repository: {
        ref: 'working-tree',
        sha: 'working-tree',
        content_sha256: 'a'.repeat(64)
    },
    standards: {
        provider: 'huggingface',
        repository: 'example/standards',
        revision: 'b'.repeat(40),
        files: [
            {path: 'standards.jsonl', sha256: 'c'.repeat(64), bytes: 12},
            {path: 'domain_groups.json', sha256: 'd'.repeat(64), bytes: 34}
        ]
    },
    ontology: {
        package: 'edugraph-ts',
        version: 'v0.15.0',
        dependency: 'https://example.test/edugraph-ts.tgz',
        resolved: 'https://example.test/edugraph-ts.tgz',
        integrity: 'sha512-exact',
        semantic_usage_sha256: 'usage-a'
    },
    selection: {
        grade: null,
        exclude_high_school: false,
        known_assets_sha256: null
    }
};

const node = (
    id: string,
    level: string,
    parent?: string,
    children: string[] = []
): StandardNode => ({
    id,
    description: id,
    level,
    aspects: [],
    parent,
    children,
    modeling: false
});

describe('standards coverage', () => {
    it('builds current-label coverage and grouped backlog tasks without generated artifacts', () => {
        const counters = createWorkCounters();
        const standardsMap = {
            '2.OA.C': node('2.OA.C', 'Cluster', undefined, [
                '2.OA.C.3',
                '2.OA.C.4',
                '2.OA.C.5',
                '2.OA.C.6',
                '2.OA.C.7'
            ]),
            '2.OA.C.3': node('2.OA.C.3', 'Standard', '2.OA.C'),
            '2.OA.C.4': node('2.OA.C.4', 'Standard', '2.OA.C'),
            '2.OA.C.5': node('2.OA.C.5', 'Standard', '2.OA.C'),
            '2.OA.C.6': node('2.OA.C.6', 'Standard', '2.OA.C'),
            '2.OA.C.7': node('2.OA.C.7', 'Standard', '2.OA.C')
        };
        const target: CompetencyTarget = {
            id: '2.OA.C.3-even',
            labels: [Area.EvenDivisibility, Scope.EvenNumbers, Ability.ConceptClassification]
        };
        const implementationTodo: ImplementationTodo = {
            id: '2.OA.C.4-arrays',
            labels: [Area.Addition, Scope.TwoOperands],
            explanation: 'Add the missing visual path.',
            implementation: {
                id: 'array-view',
                description: 'Support rectangular arrays.',
                generators: [{module: 'array', strategy: 'expand'}],
                views: [{module: 'array', strategy: 'expand'}]
            }
        };
        const ontologyTodo: OntologyTodo = {
            standardId: '2.OA.C.5',
            title: 'Missing relation',
            description: 'Add the required relation.',
            ontology: {
                id: 'relation',
                description: 'Represent the missing relation.',
                changes: [{dimension: 'Area', entities: ['Relation']}]
            }
        };
        const beyondScope: BeyondScopeEntry = {
            standardId: '2.OA.C.6',
            title: 'Excluded evidence',
            description: 'Requires evidence outside the dataset medium.'
        };

        const result = buildStandardsCoverage({
            standardsMap,
            source: {
                targets: [target],
                implementationTodos: [implementationTodo],
                ontologyTodos: [ontologyTodo],
                beyondScope: [beyondScope]
            },
            ontologyVersion: 'v0.15.0',
            generatedAt: '2026-08-14T12:00:00.000Z',
            counters,
            resolveGenerator: candidate => candidate.id === target.id ? 'parity' : null
        });

        expect(result.coverage['2.OA.C.3']).toMatchObject({
            competencies: [[Area.EvenDivisibility, Scope.EvenNumbers, Ability.ConceptClassification]],
            matched_areas: [Area.EvenDivisibility],
            matched_scopes: [Scope.EvenNumbers],
            matched_abilities: [Ability.ConceptClassification],
            dataset_covered: true,
            generator_module: 'parity',
            cluster_id: '2.OA.C'
        });
        expect(result.coverage['2.OA.C.4'].implementation_todos).toHaveLength(1);
        expect(result.coverage['2.OA.C.5'].ontology_covered).toBe(false);
        expect(result.coverage['2.OA.C.6']).toMatchObject({
            spec_covered: true,
            fully_beyond_scope: true
        });
        expect(result.coverage['2.OA.C.7']).toMatchObject({
            spec_covered: false,
            suggested_task: {title: 'Analyze Standard'}
        });
        expect(result.metadata).toEqual({
            generated_at: '2026-08-14T12:00:00.000Z',
            ontology_version: 'v0.15.0',
            total_leaves_scanned: 5,
            spec_covered_count: 4,
            covered_count: 1,
            missing_generator_count: 1,
            missing_ontology_count: 1,
            analysis_needed_count: 1,
            beyond_scope_count: 1,
            fully_beyond_scope_count: 1
        });
        expect(result.tasks.map(task => task.id)).toEqual([
            'task-implementation-array-view',
            'task-ontology-relation',
            'task-analysis-2.OA.C'
        ]);
        expect(counters.get('coverage.standard_indices')).toBe(1);
        expect(counters.get('coverage.target_standard_lookups')).toBe(2);
    });

    it('maps targets to the longest matching leaf and resolves their cluster', () => {
        const standardsMap = {
            '2.NBT.A': node('2.NBT.A', 'Cluster', undefined, ['2.NBT.A.4']),
            '2.NBT.A.4': node('2.NBT.A.4', 'Standard', '2.NBT.A')
        };

        expect(findStandardIdForTarget('2.NBT.A.4-inequality', ['2.NBT.A.4', '2.NBT.A'])).toBe('2.NBT.A.4');
        expect(findStandardIdForTarget('2.NBT.B.5-addition', ['2.NBT.A.4'])).toBeNull();
        expect(findParentClusterId('2.NBT.A.4', standardsMap)).toBe('2.NBT.A');
    });

    it('creates manifests and validates the tracked tree envelope', () => {
        expect(buildCoverageManifest({
            channel: 'preview',
            inputs: coverageInputs,
            generatedAt: '2026-08-14T12:00:00.000Z'
        })).toMatchObject({
            schema_version: 3,
            channel: 'preview',
            source_ref: 'working-tree',
            source_sha: 'working-tree',
            generated_at: '2026-08-14T12:00:00.000Z',
            ontology_version: 'v0.15.0',
            core_input_key: expect.stringMatching(/^[a-f\d]{64}$/),
            inputs: coverageInputs
        });
        expect(parseStandardsTree({tree: {}, standardsMap: {}})).toEqual({tree: {}, standardsMap: {}});
        expect(() => parseStandardsTree({tree: {}})).toThrow('Standards tree data is incomplete.');
    });
});
