import {describe, expect, it, vi} from 'vitest';
import {Ability, Area, Scope} from 'edugraph-ts';
import {generateModuleSamples} from './generation-orchestration.ts';
import {ResolvedLabelContractError} from './label-contracts.ts';
import type {GeneratorCatalogEntry, ViewCatalogEntry} from './generation.ts';
import {matchTargets} from './matching.ts';
import {CompatibilityContractError} from './compatibility.ts';
import {LabelDependencyCoverageError} from './label-dependency-coverage.ts';

function fixture(targets: readonly {id: string; labels: string[]}[],
    generate: () => {data: {value: number}}) {
    const generator = {
        type: 'arithmetic', schema: {}, generate
    } as GeneratorCatalogEntry['generator'];
    const entry = {generatorId: 'demo', generator, schema: {}, generalLabels: [Area.Addition], labels: [Area.Addition],
        module: {id: 'demo', relativePath: 'demo', absolutePath: '', category: null},
        problemType: 'ArithmeticPairProblem', spec: {generatorId: 'demo', generalLabels: [Area.Addition]}} as GeneratorCatalogEntry;
    const view = {viewId: 'demo-view', generalLabels: [Ability.ProcedureExecution], schema: {},
        module: {id: 'demo-view', relativePath: 'demo-view', absolutePath: '', category: null},
        supportedLabels: [Ability.ProcedureExecution], problemType: 'ArithmeticPairProblem',
        spec: {viewId: 'demo-view', generalLabels: [Ability.ProcedureExecution]}} as ViewCatalogEntry;
    const tuples = matchTargets([...targets], [entry], [view]).tuples;
    const run = () => generateModuleSamples(entry, new Map([[view.viewId, view]]), tuples,
        'train', new Map(), new Map());
    return {entry, view, run};
}

describe('module sample orchestration', () => {
    it('fails an unreviewed producer annotation omission before retries, solution fallback or duplicate reuse', () => {
        const base = fixture([], () => ({data: {value: 1}}));
        const generate = vi.fn(() => ({data: {operation: 'addition', num1: 2, num2: 3, answer: 5}}));
        const labels = [Area.Addition, Scope.IntegerNumbers, Scope.NumbersWithoutZero,
            Scope.NumbersWithoutNegatives, Scope.TwoOperands, Scope.SingleDigitLargestOperand];
        const entry = {...base.entry, generalLabels: labels, labels,
            generator: {type: 'arithmetic', schema: {}, generate}, spec: {generatorId: base.entry.generatorId, generalLabels: labels}} as GeneratorCatalogEntry;
        const viewLabels = [Ability.ProcedureExecution, Scope.ArabicNumerals];
        const view = {...base.view, generalLabels: viewLabels, supportedLabels: viewLabels,
            spec: {viewId: base.view.viewId, generalLabels: viewLabels}} as ViewCatalogEntry;
        const tuples = matchTargets([{id: 'missing-base', labels: [Area.Addition, Ability.ProcedureExecution]}], [entry], [view]).tuples;
        expect(() => generateModuleSamples(entry, new Map([[view.viewId, view]]), tuples,
            'train', new Map(), new Map())).toThrow(LabelDependencyCoverageError);
        expect(generate).toHaveBeenCalledTimes(1);
    });

    it('rejects stale matched capabilities before invoking generation', () => {
        const generate = vi.fn(() => ({data: {value: 1}}));
        const {entry, run} = fixture([{id: 'question', labels: [Area.Addition]}], generate);
        entry.generalLabels = [];
        expect(run).toThrow(CompatibilityContractError);
        expect(generate).not.toHaveBeenCalled();
    });

    it('does not treat a solution claim failure as a fallback-eligible generator error', () => {
        let draws = 0;
        const sample = fixture([{id: 'solution', labels: [Area.Addition]}], () => {
            if (++draws === 2) throw new ResolvedLabelContractError('Claim failure');
            return {data: {value: draws}};
        });
        expect(sample.run).toThrow(ResolvedLabelContractError);
        expect(draws).toBe(2);
    });

    it('links a duplicate target only to a sample whose resolved labels cover it', () => {
        const warning = vi.spyOn(console, 'warn').mockImplementation(() => {});
        try {
            const {run} = fixture([
                {id: 'first', labels: [Area.Addition, Ability.ProcedureExecution]},
                {id: 'second', labels: [Area.Addition, Ability.ProcedureExecution]}
            ], () => ({data: {value: 1}}));
            const samples = run();
            expect(samples).toHaveLength(2);
            expect(samples[0].associatedTargetIds.has('second')).toBe(true);
            expect(samples[0].problem.labels).toEqual([Area.Addition, Ability.ProcedureExecution].sort());
            expect(samples[0].associatedSelections.get('second')?.planHash)
                .toBe(samples[0].associatedPlans.get('second')?.hash);
            expect(samples[1].replay.sampleKey).toBe(samples[0].sampleKey);
            expect(samples[1].preparedView).toEqual(samples[0].preparedView);
        } finally {
            warning.mockRestore();
        }
    });

    it('completes a reused question draw for the actual solved mode without changing its origin or payload', () => {
        const base = fixture([], () => ({data: {value: 1}}));
        const entry: GeneratorCatalogEntry = {...base.entry, generatorId: 'arithmetic-ops-pairs',
            generator: {type: 'arithmetic', schema: {}, generate: () => ({data: {
                num1: 0, num2: 3, operation: 'multiplication', answer: 0
            }})}, generalLabels: [Area.Multiplication, Scope.IntegerNumbers, Scope.NumbersWithZero, Scope.Base10,
                Scope.NumbersWithoutNegatives, Scope.TwoOperands, Scope.SingleDigitLargestOperand],
            labels: [Area.Multiplication, Scope.IntegerNumbers, Scope.NumbersWithZero, Scope.Base10,
                Scope.NumbersWithoutNegatives, Scope.TwoOperands, Scope.SingleDigitLargestOperand],
            spec: {generatorId: 'arithmetic-ops-pairs', generalLabels: [Area.Multiplication, Scope.IntegerNumbers,
                Scope.NumbersWithZero, Scope.Base10, Scope.NumbersWithoutNegatives, Scope.TwoOperands,
                Scope.SingleDigitLargestOperand]}};
        const view: ViewCatalogEntry = {...base.view, viewId: 'operations-boxes-inversion',
            generalLabels: [Ability.ProcedureInversion, Scope.ArabicNumerals], supportedLabels: [Ability.ProcedureInversion, Scope.ArabicNumerals],
            spec: {viewId: 'operations-boxes-inversion', generalLabels: [Ability.ProcedureInversion, Scope.ArabicNumerals]}};
        const targets = [{id: 'zero-inversion', labels: [Area.Multiplication, Ability.ProcedureInversion]}];
        const tuples = matchTargets(targets, [entry], [view]).tuples;
        const samples = generateModuleSamples(entry, new Map([[view.viewId, view]]), tuples, 'train', new Map(), new Map());
        expect(samples).toHaveLength(2);
        const [question, solution] = samples;
        expect(question.problem.labels).not.toContain(Scope.SingleDigitSmallestOperand);
        expect(solution.problem.labels).toContain(Scope.SingleDigitSmallestOperand);
        expect(solution.problem.labels).toContain(Scope.SingleDigitLargestOperand);
        expect(solution.realizedLabels?.mode).toBe('solution');
        expect(question.realizedLabels?.mode).toBe('question');
        expect(solution.problem.data).toEqual(question.problem.data);
        expect(solution.contentFingerprint).toBe(question.contentFingerprint);
        expect(solution.taskFingerprint).toBe(question.taskFingerprint);
        expect(solution.replay.sampleKey).toBe(question.sampleKey);
        expect(solution.seed).toBe(question.seed);
        expect(solution.preparedView).toEqual(question.preparedView);
    });
});
