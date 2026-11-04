import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {renderToStaticMarkup} from 'react-dom/server';
import {afterAll, beforeAll, describe, expect, it, vi} from 'vitest';
import {Area, Scope} from 'edugraph-ts';
import {createCanonicalNumericRange} from '../../../lib/canonical-numeric-range.ts';
import {createGenerationSelectionReceipt} from '../../../lib/compatibility.ts';
import {loadGeneratorCatalog, loadViewCatalog, type GeneratorCatalogEntry, type ViewCatalogEntry} from '../../../lib/generation.ts';
import {enumerateDependencyAuditSelections} from '../../../lib/label-dependency-audit.ts';
import {matchTargets, type MatchTuple} from '../../../lib/matching.ts';
import {generatePlannedDraw, resolvePlannedConfigurations} from '../../../lib/planned-generation.ts';
import * as rng from '../../../lib/random.ts';
import {loadMatchingTargets} from '../../../lib/spec-validator.ts';
import type {PreparedViewConfiguration} from '../../../types/generation-plan.ts';
import type {CurrencyAmount, CurrencyArithmeticProblem} from '../../../types/problems.ts';
import {CurrencyArithmeticGenerator} from './generator.ts';
import type {CurrencyArithmeticGeneratorConfig} from './spec.ts';

const generatorId = 'currency-arithmetic', viewId = 'currency-word-problem';
type Band = {upper: number; lower: number};
type Rational = readonly [bigint, bigint];
const compare = ([a, b]: Rational, [c, d]: Rational): number => a * d < c * b ? -1 : a * d > c * b ? 1 : 0;
const money = (cents: number, dollars: boolean): Rational => [BigInt(cents), dollars || cents >= 100 ? 100n : 1n];
const thresholds = [5, 10, 20, 100, 120, 1000, 10000, 100000, 1000000];
const signature = ({lower, upper}: Band): string => `${lower}:${upper}`;
const rangeLabels = ({lower, upper}: Band): string[] => [`NumbersSmaller${upper}`, ...(lower ? [`NumbersLarger${lower}`] : [])].sort();
const hasBill = (amount: CurrencyAmount): boolean => amount.items.some(item => item.kind === 'banknote');

/** Monetary values in every shown unit, including the hidden required answer; no cent-storage scan. */
function quantities(data: CurrencyArithmeticProblem): Rational[] {
    const dollars = data.amounts.some(hasBill);
    return [...data.amounts.flatMap(amount => [
        ...amount.items.map(item => money(item.denominationCents, item.kind === 'banknote')),
        money(amount.totalCents, hasBill(amount)), money(amount.totalCents, dollars)
    ]), money(data.answerCents, dollars)];
}
function bandFor(values: readonly Rational[]): Band {
    const ordered = [...values].sort(compare);
    const upper = thresholds.find(value => compare(ordered.at(-1)!, [BigInt(value), 1n]) <= 0)!;
    const lower = thresholds.findLast(value => compare(ordered[0]!, [BigInt(value), 1n]) >= 0) ?? 0;
    return {upper, lower};
}
const bounds = (data: CurrencyArithmeticProblem): Band => bandFor(quantities(data));

const denominations = [
    {cents: 25, label: Scope.QuarterDenomination}, {cents: 10, label: Scope.TenthDenomination},
    {cents: 5, label: Scope.TwentiethDenomination}, {cents: 1, label: Scope.HundredthDenomination}
] as const;
const representations = [
    {name: 'banknotes', coins: false, bills: true, cents: 0, label: 'none' as const, suffixes: ['2b3dfb38', 'fa13c40c']},
    ...denominations.map(({cents, label}, index) => ({name: `coins${cents}`, coins: true, bills: false, cents, label,
        suffixes: [['8179576a', '2214006a'], ['d1cd676d', 'f8130e43'], ['ec8ecd5a', 'd737418c'], ['bee3451e', '6694c036']][index]!})),
    ...denominations.map(({cents, label}, index) => ({name: `mixed${cents}`, coins: true, bills: true, cents, label,
        suffixes: [['2b12dad3', '6162938d'], ['835bdbe0', '08f66dbc'], ['8d802c07', '5b5e45db'], ['16c42919', 'e33960ab']][index]!}))
];
const slices = representations.flatMap(representation => (['addition', 'subtraction'] as const).map((operation, index) => ({
    ...representation, operation, area: operation === 'addition' ? Area.Addition : Area.Subtraction,
    targetId: `2.MD.C.8-currency-word-problems~${representation.suffixes[index]}`,
    pending: representation.coins && (representation.bills || representation.cents === 25 || representation.cents === 10 && operation === 'addition')
})));
type Slice = typeof slices[number];
type Ticket = {inputs: readonly number[]; data: CurrencyArithmeticProblem; band: Band};

/** Original independent count draws, first-item equality adjustment, then subtraction ordering. */
function nativeTickets(slice: Slice): Ticket[] {
    const maximumCoins = slice.bills ? 3 : slice.cents === 25 ? 3 : 6;
    const axes = [
        ...(slice.bills ? [3] : []), ...(slice.coins ? [maximumCoins] : []),
        ...(slice.bills ? [3] : []), ...(slice.coins ? [maximumCoins] : [])
    ];
    let inputs: number[][] = [[]];
    for (const maximum of axes) inputs = inputs.flatMap(prefix => Array.from({length: maximum}, (_, index) => [...prefix, index + 1]));
    return inputs.map(input => {
        let cursor = 0;
        const amount = (): CurrencyAmount => {
            const items: CurrencyAmount['items'] = [];
            if (slice.bills) items.push({kind: 'banknote', denominationCents: 100, count: input[cursor++]!});
            if (slice.coins) items.push({kind: 'coin', denominationCents: slice.cents, count: input[cursor++]!});
            return {items, totalCents: items.reduce((sum, item) => sum + item.count * item.denominationCents, 0)};
        };
        let first = amount(), second = amount();
        if (first.totalCents === second.totalCents) {
            first.items[0]!.count++;
            first.totalCents += first.items[0]!.denominationCents;
        }
        if (slice.operation === 'subtraction' && first.totalCents < second.totalCents) [first, second] = [second, first];
        const data: CurrencyArithmeticProblem = {operation: slice.operation, amounts: [first, second],
            answerCents: slice.operation === 'addition' ? first.totalCents + second.totalCents : first.totalCents - second.totalCents};
        return {inputs: input, data, band: bounds(data)};
    });
}
const tickets = new Map(slices.map(slice => [slice.targetId, nativeTickets(slice)]));
const cells = (slice: Slice): Band[] => [...new Map(tickets.get(slice.targetId)!.map(ticket => [signature(ticket.band), ticket.band])).values()];
const pending = slices.filter(slice => slice.pending);

function conditionalIntervals(rows: readonly Ticket[], input: readonly number[]): (readonly [number, number])[] {
    return input.map((value, index) => {
        const prefix = rows.filter(row => input.slice(0, index).every((prior, i) => row.inputs[i] === prior));
        const before = prefix.filter(row => row.inputs[index]! < value).length;
        const selected = prefix.filter(row => row.inputs[index] === value).length;
        return [before / prefix.length, (before + selected) / prefix.length] as const;
    });
}
const histogram = (rows: readonly Ticket[]): Map<string, number> => {
    const result = new Map<string, number>();
    for (const {data} of rows) {
        const key = JSON.stringify(data);
        result.set(key, (result.get(key) ?? 0) + 1);
    }
    return result;
};

let generator: GeneratorCatalogEntry;
let view: ViewCatalogEntry;
let tuples: MatchTuple[];
let View: typeof import('../../../visuals/views/currency/currency-word-problem/view.tsx')['CurrencyWordProblem'];
const prepared = new Map<string, PreparedViewConfiguration>();
beforeAll(async () => {
    vi.stubGlobal('window', {});
    const root = fileURLToPath(new URL('../../../../', import.meta.url));
    const [generators, views] = await Promise.all([
        loadGeneratorCatalog(undefined, undefined, new Map([[generatorId, resolve(root, 'src/generators/currency/currency-arithmetic/spec.ts')]])),
        loadViewCatalog(undefined, undefined, new Map([[viewId, resolve(root, 'src/visuals/views/currency/currency-word-problem/spec.ts')]]))
    ]);
    generator = generators[0]!; view = views[0]!;
    ({CurrencyWordProblem: View} = await import('../../../visuals/views/currency/currency-word-problem/view.tsx'));
    tuples = matchTargets(await loadMatchingTargets('ccss'), generators, views).tuples;
    for (const tuple of tuples) for (const selection of enumerateDependencyAuditSelections(tuple.plan).selections) {
        const upper = selection.labels.find(label => /\/NumbersSmaller\d+$/.test(label));
        const lower = selection.labels.find(label => /\/NumbersLarger\d+$/.test(label));
        const band = {upper: Number(upper?.match(/\d+$/)?.[0]), lower: Number(lower?.match(/\d+$/)?.[0] ?? 0)};
        const sampleKey = `${tuple.target.id}#${generatorId}#${viewId}#train#question#inst:0`;
        prepared.set(`${tuple.target.id}#${signature(band)}`, resolvePlannedConfigurations({generatorSchema: generator.schema!,
            viewSchema: view.schema!, generatorSpec: generator.spec, viewSpec: view.spec, plan: tuple.plan, sampleKey,
            seed: 42, attempt: 1, replay: {version: 1, sampleKey, seed: 42, attempt: 1,
                selection: createGenerationSelectionReceipt(tuple.plan, selection.choices)}}).view);
    }
});
afterAll(() => vi.unstubAllGlobals());
const render = (data: CurrencyArithmeticProblem, configuration: PreparedViewConfiguration, solution: boolean): string =>
    renderToStaticMarkup(<View payload={{viewId, problem: {type: 'arithmetic', data, labels: []}, targetLabels: [],
        seed: 42, isSolutionView: solution, preparedView: configuration}} />);
const visible = (markup: string): string => markup.replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
const configurationFor = (slice: Slice, data: CurrencyArithmeticProblem): PreparedViewConfiguration =>
    prepared.get(`${slice.targetId}#${signature(bounds(data))}`)!;
const config = (slice: Slice, band: Band): CurrencyArithmeticGeneratorConfig => ({operation: slice.area, useCoins: slice.coins, useBanknotes: slice.bills,
    coinDenomination: slice.label, range: createCanonicalNumericRange(band.upper, band.lower)});

/** Test-side currency spelling, independent of the production formatter. */
function format(cents: number, dollars: boolean): string {
    if (!dollars && cents < 100) return `${cents}¢`;
    return `$${Math.floor(cents / 100)}${cents % 100 ? `.${String(cents % 100).padStart(2, '0')}` : ''}`;
}
function expectedTokens(data: CurrencyArithmeticProblem, solution: boolean): string[] {
    const dollars = data.amounts.some(hasBill);
    return [...data.amounts.flatMap(amount => [format(amount.totalCents, hasBill(amount)),
        format(amount.totalCents, dollars), format(amount.totalCents, dollars),
        ...amount.items.flatMap(item => Array.from({length: item.count}, () => format(item.denominationCents, item.kind === 'banknote')))]),
    ...(solution ? [format(data.answerCents, dollars)] : [])].sort();
}
const monetaryTokens = (text: string): string[] => [...text.matchAll(/\$\d+(?:\.\d+)?|\d+¢/g)].map(match => match[0]).sort();

describe('currency mixed-unit canonical range integration', () => {
    it('preserves all18 source routes and31 selections, with15 existing and16 newly qualified cells', () => {
        expect(tuples.map(tuple => tuple.target.id).sort()).toEqual(slices.map(slice => slice.targetId).sort());
        expect(tuples.every(tuple => tuple.generatorId === generatorId && tuple.viewId === viewId)).toBe(true);
        expect(slices.filter(slice => !slice.pending).reduce((sum, slice) => sum + cells(slice).length, 0)).toBe(15);
        expect(pending.reduce((sum, slice) => sum + cells(slice).length, 0)).toBe(16);
        expect(pending.reduce((sum, slice) => sum + tickets.get(slice.targetId)!.length, 0)).toBe(702);
        expect(slices.reduce((sum, slice) => sum + tickets.get(slice.targetId)!.length, 0)).toBe(900);
        expect(tuples.reduce((sum, tuple) => sum + enumerateDependencyAuditSelections(tuple.plan).selections.length, 0)).toBe(31);
    });

    it.each(pending)('preserves all native tickets, duplicate weights and hierarchical draws for $name $operation', slice => {
        const rows = tickets.get(slice.targetId)!, seen = new Map<string, number>();
        const random = vi.spyOn(rng, 'random'), engine = new CurrencyArithmeticGenerator();
        try {
            for (const band of cells(slice)) {
                const cell = rows.filter(row => signature(row.band) === signature(band));
                for (const row of cell) {
                    const intervals = conditionalIntervals(cell, row.inputs), middle = intervals.map(([low, high]) => (low + high) / 2);
                    const probes = [middle, ...intervals.flatMap(([low, high], index) => [
                        middle.map((point, i) => i === index ? low + (high - low) * 1e-7 : point),
                        middle.map((point, i) => i === index ? high - (high - low) * 1e-7 : point)
                    ])];
                    for (let index = 0; index < probes.length; index++) {
                        random.mockReset();
                        for (const draw of probes[index]!) random.mockReturnValueOnce(draw);
                        const generated = engine.generate(config(slice, band));
                        expect(generated?.data).toEqual(row.data);
                        expect(random).toHaveBeenCalledTimes(slice.bills ? 4 : 2);
                        if (index === 0) {
                            const key = JSON.stringify(generated!.data);
                            seen.set(key, (seen.get(key) ?? 0) + 1);
                        }
                    }
                }
            }
            expect(seen).toEqual(histogram(rows));
        } finally { random.mockRestore(); }
        for (const band of cells(slice)) for (const seed of [0, 7, 42]) {
            rng.setSeed(seed);
            const first = engine.generate(config(slice, band)), continuation = rng.getRandomState();
            rng.setSeed(seed);
            expect(engine.generate(config(slice, band))).toEqual(first);
            expect(rng.getRandomState()).toBe(continuation);
            rng.setSeed(seed);
            for (let index = 0; index < (slice.bills ? 4 : 2); index++) rng.random();
            expect(rng.getRandomState()).toBe(continuation);
        }
    });

    it.each(pending)('renders the exact shown-unit quantities and required result for $name $operation', slice => {
        const distinct = new Map(tickets.get(slice.targetId)!.map(row => [JSON.stringify(row.data), row]));
        for (const {data, band} of distinct.values()) for (const solution of [false, true]) {
            const markup = render(data, configurationFor(slice, data), solution), text = visible(markup);
            expect(monetaryTokens(text)).toEqual(expectedTokens(data, solution));
            expect(text).toContain('Money story');
            expect(text).toContain(slice.operation === 'addition' ? 'She receives' : 'She spends');
            const required = [...monetaryTokens(text).map(token => {
                if (token.endsWith('¢')) return [BigInt(token.slice(0, -1)), 1n] as const;
                const [whole, decimal = ''] = token.slice(1).split('.');
                const denominator = 10n ** BigInt(decimal.length);
                return [BigInt(whole!) * denominator + BigInt(decimal || '0'), denominator] as const;
            }), money(data.answerCents, data.amounts.some(hasBill))];
            expect(bandFor(required)).toEqual(band);
            expect(markup).toBe(render(data, configurationFor(slice, data), solution));
        }
    });

    it('distinguishes visible monetary units from cent storage and optional conversion strategies', () => {
        const quarterSub = pending.find(slice => slice.name === 'coins25' && slice.operation === 'subtraction')!;
        const quarterAdd = pending.find(slice => slice.name === 'coins25' && slice.operation === 'addition')!;
        const pennyAdd = pending.find(slice => slice.name === 'mixed1' && slice.operation === 'addition')!;
        const subtraction: CurrencyArithmeticProblem = {operation: 'subtraction', amounts: [
            {items: [{kind: 'coin', denominationCents: 25, count: 4}], totalCents: 100},
            {items: [{kind: 'coin', denominationCents: 25, count: 3}], totalCents: 75}], answerCents: 25};
        const addition: CurrencyArithmeticProblem = {operation: 'addition', amounts: [
            {items: [{kind: 'coin', denominationCents: 25, count: 3}], totalCents: 75},
            {items: [{kind: 'coin', denominationCents: 25, count: 3}], totalCents: 75}], answerCents: 150};
        const mixed = tickets.get(pennyAdd.targetId)!.find(row => row.inputs.join(',') === '1,1,1,2')!.data;
        expect(bounds(subtraction)).toEqual({upper: 100, lower: 0});
        expect(bounds(addition)).toEqual({upper: 100, lower: 0});
        expect(bounds(mixed)).toEqual({upper: 5, lower: 0});
        expect(visible(render(subtraction, configurationFor(quarterSub, subtraction), true))).toContain('$1 − 75¢ = 25¢');
        // A valid public-renderer fixture; equal operands are adjusted by the native sampler.
        expect(visible(render(addition, configurationFor(quarterAdd, addition), true))).toContain('75¢ + 75¢ = $1.50');
        expect(visible(render(mixed, configurationFor(pennyAdd, mixed), true))).toContain('$1.01 + $1.02 = $2.03');
        const adjusted = tickets.get(pennyAdd.targetId)!.find(row => row.inputs.join(',') === '2,1,2,1')!.data;
        expect(adjusted.amounts[0]!.items).toEqual([{kind: 'banknote', denominationCents: 100, count: 3},
            {kind: 'coin', denominationCents: 1, count: 1}]);
        expect(bounds(adjusted)).toEqual({upper: 10, lower: 0});
    });

    it.each(slices)('independently checks every selection and exact receipt replay for $name $operation', slice => {
        const tuple = tuples.find(tuple => tuple.target.id === slice.targetId)!;
        const enumeration = enumerateDependencyAuditSelections(tuple.plan);
        expect(enumeration.status).toBe('complete');
        expect(enumeration.selections).toHaveLength(cells(slice).length);
        for (const selection of enumeration.selections) for (let seed = 0; seed < 8; seed++) {
            const sampleKey = `${slice.targetId}#${generatorId}#${viewId}#train#question#inst:0`;
            const input = {generator: generator.generator, generatorSpec: generator.spec, viewSchema: view.schema, viewSpec: view.spec,
                plan: tuple.plan, sampleKey, seed, attempt: 1, replay: {version: 1 as const, sampleKey, seed, attempt: 1,
                    selection: createGenerationSelectionReceipt(tuple.plan, selection.choices)}};
            const draw = generatePlannedDraw(input);
            expect(draw.stub).not.toBeNull();
            expect(draw.labels.map(label => label.slice(label.lastIndexOf('/') + 1)).filter(label => /^Numbers(?:Smaller|Larger)\d+$/.test(label)).sort())
                .toEqual(rangeLabels(bounds(draw.stub!.data as CurrencyArithmeticProblem)));
            expect(draw.labels).toContain(Scope.NumbersWithoutNegatives);
            expect(draw.labels).toContain(Scope.NumbersWithoutZero);
            expect(generatePlannedDraw(input)).toEqual(draw);
        }
    });
});
