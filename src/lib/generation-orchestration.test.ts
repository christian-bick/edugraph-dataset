import {describe, expect, it, vi} from 'vitest';
import {Ability, Area} from 'edugraph-ts';
import {generateModuleSamples} from './generation-orchestration.ts';
import {ResolvedLabelContractError} from './label-contracts.ts';
import type {GeneratorCatalogEntry, ViewCatalogEntry} from './generation.ts';
import {matchTargets} from './matching.ts';
import {CompatibilityContractError} from './compatibility.ts';

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
});
