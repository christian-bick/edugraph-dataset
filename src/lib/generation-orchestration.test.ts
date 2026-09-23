import {describe, expect, it, vi} from 'vitest';
import {Ability, Area} from 'edugraph-ts';
import {generateModuleSamples} from './generation-orchestration.ts';
import {ResolvedLabelContractError} from './label-contracts.ts';
import type {GeneratorCatalogEntry, MatchTuple, ViewCatalogEntry} from './generation.ts';

function fixture(targets: readonly {id: string; labels: string[]}[],
    generate: () => {data: {value: number}}) {
    const generator = {
        type: 'arithmetic', schema: {}, generate
    } as GeneratorCatalogEntry['generator'];
    const entry = {generatorId: 'demo', generator, generalLabels: [Area.Addition]} as GeneratorCatalogEntry;
    const view = {viewId: 'demo-view', generalLabels: [Ability.ProcedureExecution], schema: {}} as ViewCatalogEntry;
    const tuples = targets.map(target => ({target, generatorId: 'demo', viewId: 'demo-view'})) as MatchTuple[];
    const run = () => generateModuleSamples(entry, new Map([[view.viewId, view]]), tuples,
        'train', new Map(), new Map());
    return {entry, view, run};
}

describe('module sample orchestration', () => {
    it('rejects an unresolved question claim on the first draw before creating a sample', () => {
        const generate = vi.fn(() => ({data: {value: 1}}));
        const {entry, run} = fixture([{id: 'question', labels: [Area.Addition]}], generate);
        entry.generalLabels = [];
        expect(run).toThrow(ResolvedLabelContractError);
        expect(generate).toHaveBeenCalledTimes(1);
    });

    it('does not treat a solution claim failure as a fallback-eligible generator error', () => {
        let draws = 0;
        let entry: GeneratorCatalogEntry;
        const sample = fixture([{id: 'solution', labels: [Area.Addition]}], () => {
            if (++draws === 2) entry.generalLabels = [];
            return {data: {value: draws}};
        });
        entry = sample.entry;
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
        } finally {
            warning.mockRestore();
        }
    });
});
