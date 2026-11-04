import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createElement, type ComponentType} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {afterAll, beforeAll, describe, expect, it, vi} from 'vitest';
import {Ability, Area, Scope} from 'edugraph-ts';
import {createCanonicalNumericRange, hasCanonicalRangeWitness, type CanonicalNumericRange} from '../../lib/canonical-numeric-range.ts';
import {createGenerationSelectionReceipt} from '../../lib/compatibility.ts';
import {loadGeneratorCatalog, loadViewCatalog} from '../../lib/generation.ts';
import {enumerateDependencyAuditSelections} from '../../lib/label-dependency-audit.ts';
import {createLabelDependencyEvaluator} from '../../lib/label-dependencies.ts';
import {matchTargets, type MatchTuple} from '../../lib/matching.ts';
import {generatePlannedDraw, resolvePlannedConfigurations} from '../../lib/planned-generation.ts';
import * as rng from '../../lib/random.ts';
import {loadMatchingTargets} from '../../lib/spec-validator.ts';
import type {PreparedViewConfiguration} from '../../types/generation-plan.ts';
import type {RenderPayload} from '../../types/ml-engine.ts';
import type {CountingEnumerationProblem, CountingTotalProblem} from '../../types/problems.ts';

type Contract = 'enumeration' | 'total';
type Parity = 'any' | 'even' | 'odd';
const parities = ['any', 'even', 'odd'] as const;
const generatorIds = {enumeration: 'counting-basic', total: 'counting-total'} as const;
const cells = [
    {contract: 'enumeration', lower: 0, upper: 5, first: 1, last: 5},
    {contract: 'enumeration', lower: 0, upper: 10, first: 6, last: 10},
    {contract: 'enumeration', lower: 0, upper: 20, first: 11, last: 20},
    {contract: 'total', lower: 0, upper: 5, first: 1, last: 4},
    {contract: 'total', lower: 5, upper: 10, first: 6, last: 9},
    {contract: 'total', lower: 10, upper: 20, first: 11, last: 19}
] as const;
type Cell = typeof cells[number];
const counts = (cell: Cell, parity: Parity): number[] => Array.from({length: cell.last - cell.first + 1},
    (_, index) => cell.first + index).filter(count => parity === 'any' || count % 2 === (parity === 'even' ? 0 : 1));
const rangeFor = (cell: Cell) => createCanonicalNumericRange(cell.upper, cell.lower);
const cellLabels = (cell: Cell): string[] => [
    Scope[`NumbersSmaller${cell.upper}`], ...(cell.lower ? [Scope[`NumbersLarger${cell.lower}`]] : [])
];
const parityLabels = (parity: Parity) => parity === 'any' ? [] : [parity === 'even' ? Scope.EvenNumbers : Scope.OddNumbers];
function dataFor(contract: Contract, count: number, parity: Parity): CountingEnumerationProblem | CountingTotalProblem {
    const scalar = {numObjects: count, simpleAnswer: count, ...(parity === 'any' ? {} : {parity})};
    return contract === 'enumeration' ? {...scalar, kind: 'counting-enumeration',
        countingNumbers: Array.from({length: count}, (_, index) => index + 1)} : {...scalar, kind: 'counting-total'};
}
const quantities = (data: CountingEnumerationProblem | CountingTotalProblem): readonly number[] =>
    data.kind === 'counting-enumeration' ? [...data.countingNumbers, data.numObjects] : [data.numObjects, data.numObjects];
const consumers = [
    {viewId: 'counting-objects-simple', exported: 'CountingObjectsSimple', contract: 'enumeration',
        ability: Ability.ProcedureUnderstanding, sourceRoutes: 10,
        arrangements: [Scope.LinearArrangement, Scope.CircularArrangement, Scope.ScatteredArrangement, Scope.BoxArrangement]},
    {viewId: 'counting-objects-one-to-one', exported: 'CountingObjectsOneToOne', contract: 'enumeration',
        ability: Ability.ProcedureExecution, sourceRoutes: 8,
        arrangements: [Scope.LinearArrangement, Scope.CircularArrangement, Scope.ScatteredArrangement]},
    {viewId: 'counting-objects-cardinality', exported: 'CountingObjectsCardinality', contract: 'enumeration',
        ability: Ability.ProcedureUnderstanding, sourceRoutes: 0,
        arrangements: [Scope.LinearArrangement, Scope.CircularArrangement, Scope.ScatteredArrangement]},
    {viewId: 'counting-conservation', exported: 'CountingConservation', contract: 'total',
        ability: Ability.DirectUnderstanding, sourceRoutes: 3, arrangements: [undefined]}
] as const;
type Consumer = typeof consumers[number];
const projections = consumers.flatMap(consumer => consumer.arrangements.map(arrangement => ({consumer, arrangement})));
const evaluator = createLabelDependencyEvaluator();
let generators: Awaited<ReturnType<typeof loadGeneratorCatalog>>;
let views: Awaited<ReturnType<typeof loadViewCatalog>>;
let tuples: MatchTuple[];
const components = new Map<string, ComponentType<{payload: RenderPayload}>>();
const prepared = new Map<string, PreparedViewConfiguration>();

beforeAll(async () => {
    vi.stubGlobal('window', {});
    const root = fileURLToPath(new URL('../../../', import.meta.url));
    [generators, views] = await Promise.all([
        loadGeneratorCatalog(undefined, undefined, new Map(Object.values(generatorIds).map(id =>
            [id, resolve(root, `src/generators/counting/${id}/spec.ts`)]))),
        loadViewCatalog(undefined, undefined, new Map(consumers.map(({viewId}) =>
            [viewId, resolve(root, `src/visuals/views/counting/${viewId}/spec.ts`)])))
    ]);
    tuples = matchTargets(await loadMatchingTargets('ccss'), generators, views).tuples;
    for (const consumer of consumers) {
        const module = await import(`../../visuals/views/counting/${consumer.viewId}/view.tsx`);
        expect(typeof module[consumer.exported]).toBe('function');
        components.set(consumer.viewId, module[consumer.exported]);
    }
});
afterAll(() => vi.unstubAllGlobals());

function preparedFor(consumer: Consumer, arrangement: Scope | undefined, cell: Cell, parity: Parity) {
    const key = `${consumer.viewId}:${arrangement}:${cell.upper}:${parity}`;
    const cached = prepared.get(key);
    if (cached) return cached;
    const target = {id: `q15-${consumers.indexOf(consumer)}-${consumer.arrangements.findIndex(value => value === arrangement)}-${cell.upper}-${parity}`,
        labels: [Area.NumerationWithIntegers, Scope.IntegerNumbers, Scope.NumbersWithoutZero,
            ...cellLabels(cell), ...parityLabels(parity), ...(arrangement ? [arrangement] : []), consumer.ability]};
    const generator = generators.find(entry => entry.generatorId === generatorIds[consumer.contract])!;
    const view = views.find(entry => entry.viewId === consumer.viewId)!;
    const tuple = matchTargets([target], [generator], [view]).tuples[0];
    if (!tuple) throw new Error(`Valid ${consumer.viewId} consumer must admit its mathematical family.`);
    const value = resolvePlannedConfigurations({generatorSchema: generator.schema!, viewSchema: view.schema!,
        generatorSpec: generator.spec, viewSpec: view.spec, plan: tuple.plan,
        sampleKey: `${target.id}#${generator.generatorId}#${view.viewId}#train#question#inst:0`, seed: 37, attempt: 1}).view;
    prepared.set(key, value);
    return value;
}

describe('counting total and enumeration range contracts', () => {
    it.each(cells.flatMap(cell => parities.map(parity => ({cell, parity}))))(
        'preserves the complete $cell.contract band $cell.lower/$cell.upper for $parity totals', ({cell, parity}) => {
            const generator = generators.find(entry => entry.generatorId === generatorIds[cell.contract])!.generator;
            const expected = counts(cell, parity), draw = vi.spyOn(rng, 'random');
            try {
                for (let index = 0; index < expected.length; index++) {
                    draw.mockReset().mockReturnValue((index + 0.5) / expected.length);
                    const data = generator.generate({range: rangeFor(cell), parity})!.data;
                    expect(data).toEqual(dataFor(cell.contract, expected[index]!, parity));
                    expect(draw).toHaveBeenCalledTimes(1);
                    expect(hasCanonicalRangeWitness(quantities(data), rangeFor(cell))).toBe(true);
                }
            } finally { draw.mockRestore(); }
            rng.setSeed(`${cell.contract}:${cell.upper}:${parity}`);
            rng.random();
            const continuation = rng.getRandomState();
            rng.setSeed(`${cell.contract}:${cell.upper}:${parity}`);
            expect(generator.generate({range: rangeFor(cell), parity})).not.toBeNull();
            expect(rng.getRandomState()).toBe(continuation);
        });

    it.each(consumers)('preserves all $sourceRoutes source routes for $viewId', consumer => {
        const routes = tuples.filter(tuple => tuple.viewId === consumer.viewId);
        expect(routes).toHaveLength(consumer.sourceRoutes);
        expect(tuples).toHaveLength(21);
        for (const tuple of routes) {
            expect(tuple.generatorId).toBe(generatorIds[consumer.contract]);
            const generator = generators.find(entry => entry.generatorId === tuple.generatorId)!;
            const view = views.find(entry => entry.viewId === tuple.viewId)!;
            const enumeration = enumerateDependencyAuditSelections(tuple.plan);
            expect(enumeration.status).toBe('complete');
            expect(enumeration.selections).toHaveLength(1);
            for (const selection of enumeration.selections) for (const seed of [0, 7, 37, 82]) {
                const sampleKey = `${tuple.target.id}#${tuple.generatorId}#${tuple.viewId}#train#question#inst:0`;
                const replay = {version: 1 as const, sampleKey, seed, attempt: 1,
                    selection: createGenerationSelectionReceipt(tuple.plan, selection.choices)};
                const input = {generator: generator.generator, generatorSpec: generator.spec, viewSpec: view.spec,
                    viewSchema: view.schema, plan: tuple.plan, sampleKey, seed, attempt: 1, replay};
                const resolved = resolvePlannedConfigurations({...input, generatorSchema: generator.schema!});
                rng.setRandomState(resolved.generatorRandomState);
                const direct = generator.generator.generate(resolved.generatorConfig), continuation = rng.getRandomState();
                const drawn = generatePlannedDraw(input);
                expect(direct).not.toBeNull();
                expect(drawn.stub).toEqual({...direct, labels: resolved.generatorLabels});
                expect(rng.getRandomState()).toBe(continuation);
                expect(generatePlannedDraw(input)).toEqual(drawn);
                expect(rng.getRandomState()).toBe(continuation);
                const data = drawn.stub!.data as CountingEnumerationProblem | CountingTotalProblem;
                expect(data.kind).toBe(consumer.contract === 'enumeration' ? 'counting-enumeration' : 'counting-total');
                const range = (resolved.generatorConfig as unknown as {range: CanonicalNumericRange}).range;
                expect(hasCanonicalRangeWitness(quantities(data), range)).toBe(true);
                const evaluated = evaluator.evaluate(drawn.labels);
                expect(evaluated.errors).toEqual([]);
                expect(evaluated.conflicts).toEqual([]);
                expect(evaluated.assessments.filter(item => item.status === 'missing')).toEqual([]);
            }
        }
    });

    it.each(projections)('renders complete native support for $consumer.viewId / $arrangement in both modes', ({consumer, arrangement}) => {
        let renderings = 0;
        for (const cell of cells.filter(cell => cell.contract === consumer.contract)) for (const parity of parities) {
            const preparedView = preparedFor(consumer, arrangement, cell, parity);
            for (const count of counts(cell, parity)) for (const isSolutionView of [false, true]) {
                const payload: RenderPayload = {viewId: consumer.viewId, seed: 37, isSolutionView, preparedView,
                    targetLabels: [], problem: {type: 'counting', labels: [], data: dataFor(consumer.contract, count, parity)}};
                const html = renderToStaticMarkup(createElement(components.get(consumer.viewId)!, {payload}));
                expect(html).not.toMatch(/data-view-error|NaN|undefined/);
                if (consumer.contract === 'total') {
                    expect((html.match(/alt="object A"/g) ?? []).length).toBe(count);
                    expect((html.match(/alt="object B"/g) ?? []).length).toBe(count);
                    expect(html).toContain('They are the same');
                } else {
                    expect((html.match(/alt="counting object"/g) ?? []).length).toBe(count);
                    if (isSolutionView) expect(html).toContain(`>${count}<`);
                    else expect(html).toContain(consumer.viewId === 'counting-objects-one-to-one'
                        ? 'Write the numbers in order using digits.' : consumer.viewId === 'counting-objects-cardinality'
                            ? 'Count the objects. Write the total in digits.' : 'How many objects are there?');
                }
                renderings++;
            }
        }
        expect(renderings).toBe(consumer.contract === 'total' ? 68 : 80);
    });
});
