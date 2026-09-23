import {beforeEach, describe, expect, it, vi} from 'vitest';
import {Area, Ability} from 'edugraph-ts';
import {normalizeAndValidateSpec} from './spec-validator.ts';
import {loadSpecTodos} from './spec-catalog.ts';
import {validateStandardContracts, readStandardsMatchingGraph} from './standards-validation.ts';
import {readDatasetManifest, datasetOntologyProvenanceHash} from './dataset-manifest.ts';
import {createDependencyGraphSnapshot} from './dependency-planner.ts';
import {buildDependencyMatchingIndex, generatorCapabilityInputHash, generatorCapabilityNodeId,
    viewCapabilityInputHash, viewCapabilityNodeId, targetCapabilityInputHash, targetCapabilityNodeId,
    matchingPolicyInputHash, matchingPolicyNodeId, modulePairNodeId} from './matching.ts';

vi.mock('./spec-validator.ts', () => ({normalizeAndValidateSpec: vi.fn()}));
vi.mock('./spec-catalog.ts', async importOriginal => ({...await importOriginal<object>(), loadSpecTodos: vi.fn()}));
vi.mock('./dataset-manifest.ts', () => ({readDatasetManifest: vi.fn(), datasetOntologyProvenanceHash: vi.fn(() => 'current')}));

describe('shared standards checks', () => {
    beforeEach(() => {
        vi.mocked(normalizeAndValidateSpec).mockResolvedValue({targets: [], errors: [], warnings: [],
            stats: {totalTargets: 0, uniqueTargets: 0, deduplicatedCount: 0}, equivalences: []});
        vi.mocked(loadSpecTodos).mockResolvedValue({implementationTodos: [], ontologyTodos: [], beyondScope: []});
    });
    it('rejects unmatched active targets in production and isolated specs', async () => {
        for (const name of ['ccss', 'test']) {
            const result = await normalizeAndValidateSpec(name);
            result.targets = [{id: 'active', labels: [Area.Addition, Ability.ProcedureExecution]}];
            expect((await validateStandardContracts(name, [], [])).errors.join()).toContain('TSPEC-9');
        }
    });
    it('does not match TODO or beyond-scope exports', async () => {
        vi.mocked(loadSpecTodos).mockResolvedValue({implementationTodos: [{id: 'pending', labels: [Area.Addition, Ability.ProcedureExecution]}],
            ontologyTodos: [{standardId: 'new-ontology'}], beyondScope: [{standardId: 'outside'}]} as never);
        expect((await validateStandardContracts('ccss', [], [])).errors).toEqual([]);
        expect(loadSpecTodos).toHaveBeenCalled();
    });
    it('enforces label/cardinality errors before matching', async () => {
        const result = await normalizeAndValidateSpec('ccss');
        result.targets = [{id: 'invalid', labels: ['unknown']}];
        expect((await validateStandardContracts('ccss', [], [])).errors).toHaveLength(3);
    });
    it('keeps full and affected results equal when an active target or capability changes', async () => {
        const target = {id: 'addition', labels: [Area.Addition, Ability.ProcedureExecution]};
        const generator = {generatorId: 'math', labels: [Area.Addition], problemType: 'ArithmeticPairProblem'};
        const view = {viewId: 'question', supportedLabels: [Ability.ProcedureExecution], problemType: 'ArithmeticPairProblem'};
        const graph = createDependencyGraphSnapshot([
            {id: matchingPolicyNodeId(), kind: 'matching-policy', input_hash: matchingPolicyInputHash(), dependencies: []},
            {id: targetCapabilityNodeId('ccss', target.id), kind: 'target-capability', input_hash: targetCapabilityInputHash(target), dependencies: []},
            {id: generatorCapabilityNodeId('math'), kind: 'generator-capability', input_hash: generatorCapabilityInputHash(generator), dependencies: []},
            {id: viewCapabilityNodeId('question'), kind: 'view-capability', input_hash: viewCapabilityInputHash(view), dependencies: []},
            {id: modulePairNodeId('math', 'question'), kind: 'module-pair', input_hash: 'pair', dependencies: []}
        ], undefined, buildDependencyMatchingIndex([target], [{target, generatorId: 'math', viewId: 'question'}]));
        vi.mocked(readDatasetManifest).mockReturnValue({spec: 'ccss', dependency_graph: graph,
            ontology_provenance_hash: 'current'} as never);
        for (const changedCapability of [false, true]) {
            const targets = changedCapability ? [target] : [target, {id: 'subtraction', labels: [Area.Subtraction, Ability.ProcedureExecution]}];
            const generators = [{...generator, labels: changedCapability ? [Area.Subtraction] : generator.labels}];
            const run = (affected?: string) => {
                vi.mocked(normalizeAndValidateSpec).mockResolvedValue({targets, errors: [], warnings: [],
                    stats: {totalTargets: targets.length, uniqueTargets: targets.length, deduplicatedCount: 0}, equivalences: []});
                return validateStandardContracts('ccss', generators as never, [view] as never, undefined, affected);
            };
            const full = await run();
            expect((await run('.')).errors).toEqual(full.errors);
            expect(full.errors).toHaveLength(1);
        }
    });
    it('rejects a generator with no generatable isolated test path', async () => {
        expect((await validateStandardContracts('test', [{generatorId: 'uncovered', labels: []}] as never, [])).errors)
            .toEqual(["TSPEC-12 test: generator 'uncovered' has no generatable target/view path."]);
    });
    it('uses only a current, complete graph with identical pinned ontology provenance', () => {
        const graph = createDependencyGraphSnapshot([]);
        vi.mocked(readDatasetManifest).mockReturnValue({spec: 'ccss', dependency_graph: graph,
            ontology_provenance_hash: 'current'} as never);
        expect(readStandardsMatchingGraph('.', 'ccss')).toBe(graph);
        expect(readStandardsMatchingGraph('.', 'test')).toBeNull();
        vi.mocked(datasetOntologyProvenanceHash).mockReturnValueOnce('changed');
        expect(readStandardsMatchingGraph('.', 'ccss')).toBeNull();
        vi.mocked(readDatasetManifest).mockReturnValue(null);
        expect(readStandardsMatchingGraph('.', 'ccss')).toBeNull();
    });
});
