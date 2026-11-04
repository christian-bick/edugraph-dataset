import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import type {ReactElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {afterAll, beforeAll, describe, expect, it, vi} from 'vitest';
import {Ability, Area, Scope} from 'edugraph-ts';
import {createCanonicalNumericRange} from '../../lib/canonical-numeric-range.ts';
import {createGenerationSelectionReceipt} from '../../lib/compatibility.ts';
import {loadGeneratorCatalog, loadViewCatalog, type GeneratorCatalogEntry, type ViewCatalogEntry} from '../../lib/generation.ts';
import {enumerateDependencyAuditSelections} from '../../lib/label-dependency-audit.ts';
import {buildCompatibleModulePairIndex, matchTarget, matchTargets, type MatchTuple} from '../../lib/matching.ts';
import {generatePlannedDraw} from '../../lib/planned-generation.ts';
import * as randomModule from '../../lib/random.ts';
import {loadMatchingTargets} from '../../lib/spec-validator.ts';
import {formatStandardNumeral} from '../../lib/whole-number-notation.ts';
import type {MeasurementConversionPair, MeasurementConversionStoryProblem, MeasurementConversionValuesProblem,
    UnitEquivalenceProblem, UnitEquivalenceSequenceProblem} from '../../types/problems.ts';
import {isValidUnitEquivalence, isValidUnitEquivalenceSequence} from '../../visuals/helpers/measurement-conversion.ts';
import {ViewValidationError} from '../../visuals/helpers/validation.ts';
import {MeasureConversionTableCore} from '../../visuals/views/measure/measure-conversion-table-view.tsx';
import {MeasureConversionBidirectionalView, MeasureConversionDerivationView, MeasureConversionToSmallerView} from '../../visuals/views/measurement/measure-conversion-view.tsx';
import {MeasurementUnitEquivalenceGenerator} from './measurement-unit-equivalence/generator.ts';
import {MeasurementUnitEquivalencesGenerator} from './measurement-unit-equivalences/generator.ts';

const singleId = 'measurement-unit-equivalence', tableId = 'measurement-unit-equivalences';
const factorId = 'measurement-unit-scale', countId = 'measurement-unit-count-relations';
const numericId = 'measurement-conversion-values', storyId = 'measurement-conversion-problems';
const derivationView = 'measure-conversion-derivation', smallerView = 'measure-conversion-to-smaller', tableView = 'measure-conversion-table';
const countView = 'measure-unit-scale-relation', numericView = 'measure-conversion-bidirectional', storyView = 'measure-conversion-problems';
const generatorIds = [singleId, tableId, factorId, countId, numericId, storyId];
const viewIds = [derivationView, smallerView, tableView, countView, numericView, storyView];
const validPairs = [[singleId, derivationView], [singleId, smallerView], [tableId, tableView], [factorId, derivationView],
    [countId, countView], [numericId, numericView], [storyId, storyView]] as const;
const starts = [2, 3, 4, 5, 6, 7, 8, 9];
const pairs = [
    {id: 'kilometer-meter', quantityKind: 'length', scalingKind: 'magnitude', largerUnit: 'kilometer', smallerUnit: 'meter', factor: 1000},
    {id: 'meter-centimeter', quantityKind: 'length', scalingKind: 'magnitude', largerUnit: 'meter', smallerUnit: 'centimeter', factor: 100},
    {id: 'kilogram-gram', quantityKind: 'weight', scalingKind: 'magnitude', largerUnit: 'kilogram', smallerUnit: 'gram', factor: 1000},
    {id: 'pound-ounce', quantityKind: 'weight', scalingKind: 'factor', largerUnit: 'pound', smallerUnit: 'ounce', factor: 16},
    {id: 'liter-milliliter', quantityKind: 'liquid-volume', scalingKind: 'magnitude', largerUnit: 'liter', smallerUnit: 'milliliter', factor: 1000},
    {id: 'hour-minute', quantityKind: 'time', scalingKind: 'factor', largerUnit: 'hour', smallerUnit: 'minute', factor: 60},
    {id: 'minute-second', quantityKind: 'time', scalingKind: 'factor', largerUnit: 'minute', smallerUnit: 'second', factor: 60}
] as const satisfies readonly MeasurementConversionPair[];
const unitLabels = [
    [Area.UnitMagnitudeScaling, Scope.KilometerScale, Scope.MeterScale],
    [Area.UnitMagnitudeScaling, Scope.MeterScale, Scope.CentimeterScale],
    [Area.UnitMagnitudeScaling, Scope.KilogramScale, Scope.GramScale],
    [Area.UnitFactorScaling, Scope.PoundScale, Scope.OunceScale],
    [Area.UnitMagnitudeScaling, Scope.VolumeMeasurement, Scope.LiquidVolumes, Scope.LiterScale, Scope.MilliliterScale],
    [Area.UnitFactorScaling, Scope.HourIntervals, Scope.MinuteIntervals],
    [Area.UnitFactorScaling, Scope.MinuteIntervals, Scope.SecondIntervals]
];
const routeGroups = [
    ['4.MD.A.1-relative-unit-sizes', derivationView, singleId, ['721c4484', '37011a34', 'f1eb2eac', '61191bec', '50273af9', '7862ffb2', 'ec78131c']],
    ['4.MD.A.1-convert-larger-to-smaller', smallerView, singleId, ['0dc1a110', 'cdecceb8', '6ea7549c', 'd627fae0', '2b09e157', '9d41680e', '7a9cfb62']],
    ['5.MD.A.1-convert-within-system', smallerView, singleId, ['9567e196', 'b849740e', 'c38cea16', 'bb6a550e', '8a0208b9', '15ef46a4', 'b8f153a0']],
    ['4.MD.A.1-two-column-tables', tableView, tableId, ['67ecb5f2', '460318ae', 'fc1e82da', 'cefbb75a', '89b0a189', '326d4c18', '3558723a']]
] as const;
type Named = UnitEquivalenceProblem | UnitEquivalenceSequenceProblem;
const single = (pair: MeasurementConversionPair, start: number): UnitEquivalenceProblem => ({kind: 'unit-equivalence', pair,
    equivalent: {largerValue: start, smallerValue: start * pair.factor}});
const table = (pair: MeasurementConversionPair, start: number): UnitEquivalenceSequenceProblem => ({pair,
    equivalents: Array.from({length: 5}, (_, index) => ({largerValue: start + index, smallerValue: (start + index) * pair.factor}))});

/** Actual measurement quantities, including the one-unit relation only in the single contract. */
function bounds(data: Named): {upper: number; lower: number} {
    const values = [BigInt(data.pair.factor)];
    if ('kind' in data) {
        expect(BigInt(data.equivalent.smallerValue)).toBe(BigInt(data.equivalent.largerValue) * BigInt(data.pair.factor));
        values.push(1n, BigInt(data.equivalent.largerValue), BigInt(data.equivalent.smallerValue));
    } else {
        expect(data.equivalents).toHaveLength(5);
        data.equivalents.forEach((row, index) => {
            expect(row.largerValue).toBe(data.equivalents[0]!.largerValue + index);
            expect(BigInt(row.smallerValue)).toBe(BigInt(row.largerValue) * BigInt(data.pair.factor));
            values.push(BigInt(row.largerValue), BigInt(row.smallerValue));
        });
    }
    values.sort((a, b) => a < b ? -1 : a > b ? 1 : 0);
    const thresholds = [5, 10, 20, 100, 120, 1000, 10000, 100000, 1000000];
    const upper = thresholds.find(value => values.at(-1)! <= BigInt(value))!;
    const lower = thresholds.findLast(value => values[0]! >= BigInt(value)) ?? 0;
    expect(lower).toBeLessThan(upper);
    return {upper, lower};
}
const rangeLabels = ({upper, lower}: {upper: number; lower: number}): string[] =>
    [`NumbersSmaller${upper}`, ...(lower ? [`NumbersLarger${lower}`] : [])].sort();
const cells = (pair: MeasurementConversionPair, sequence: boolean): {upper: number; lower: number}[] =>
    [...new Map(starts.map(start => {
        const range = bounds(sequence ? table(pair, start) : single(pair, start));
        return [JSON.stringify(range), range] as const;
    })).values()];
const lineages = routeGroups.flatMap(([prefix, viewId, generatorId, suffixes]) => suffixes.map((suffix, index) => ({
    targetId: `${prefix}~${suffix}`, viewId, generatorId, pair: pairs[index]!, count: cells(pairs[index]!, generatorId === tableId).length
})));
function numeric(pair: MeasurementConversionPair, decimal: boolean): MeasurementConversionValuesProblem {
    const equality = (largerHundredths: number) => ({largerHundredths, smallerHundredths: largerHundredths * pair.factor});
    return {pair, numericExamples: {numberKind: decimal ? 'decimal' : 'integer',
        equalities: [equality(decimal ? 125 : 200), equality(decimal ? 225 : 300)]}};
}
function story(pair: MeasurementConversionPair, decimal: boolean, sourceSide: 'larger' | 'smaller'): MeasurementConversionStoryProblem {
    const largerHundredths = decimal ? 125 : 200, smallerHundredths = largerHundredths * pair.factor;
    const additionalTargetHundredths = decimal ? 25 : 100;
    return {kind: 'measurement-conversion-story', pair, numberKind: decimal ? 'decimal' : 'integer', sourceSide,
        conversion: {largerHundredths, smallerHundredths}, additionalTargetHundredths,
        totalTargetHundredths: (sourceSide === 'larger' ? smallerHundredths : largerHundredths) + additionalTargetHundredths};
}

let generators: GeneratorCatalogEntry[];
let views: ViewCatalogEntry[];
let tuples: MatchTuple[];
const cores = new Map<string, (props: never) => ReactElement>();
beforeAll(async () => {
    vi.stubGlobal('window', {});
    const root = fileURLToPath(new URL('../../../', import.meta.url));
    [generators, views] = await Promise.all([
        loadGeneratorCatalog(undefined, undefined, new Map(generatorIds.map(id => [id, resolve(root, 'src/generators/measurement', id, 'spec.ts')]))),
        loadViewCatalog(undefined, undefined, new Map(viewIds.map(id => [id, resolve(root, 'src/visuals/views',
            id === countView || id === tableView ? 'measure' : 'measurement', id, 'spec.ts')])))
    ]);
    cores.set(derivationView, MeasureConversionDerivationView);
    cores.set(smallerView, MeasureConversionToSmallerView);
    cores.set(tableView, MeasureConversionTableCore);
    cores.set(numericView, MeasureConversionBidirectionalView);
    cores.set(countView, (await import('../../visuals/views/measure/measure-unit-scale-relation/view.tsx')).MeasureUnitScaleRelationCore);
    cores.set(storyView, (await import('../../visuals/views/measurement/measure-conversion-problems/view.tsx')).MeasureConversionProblemsCore);
    tuples = matchTargets(await loadMatchingTargets('ccss'), generators, views).tuples.filter(tuple => [singleId, tableId].includes(tuple.generatorId));
});
afterAll(() => vi.unstubAllGlobals());
const render = (viewId: string, data: unknown, solution: boolean): string => renderToStaticMarkup(cores.get(viewId)!({config: {}, payload: {
    viewId, problem: {type: 'measurement', data, labels: []}, targetLabels: [], isSolutionView: solution, seed: 42
}} as never));
const visible = (markup: string): string => markup.replace(/<[^>]*>/g, ' ').replace(/&gt;/g, '>').replace(/&lt;/g, '<')
    .replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();

describe('named-unit single equivalence and table contract integration', () => {
    it('preserves all seven legitimate pairs and all28 source target/view lineages', () => {
        expect(buildCompatibleModulePairIndex(generators, views).orderedPairs.map(pair => `${pair.generator.generatorId}#${pair.view.viewId}`).sort())
            .toEqual(validPairs.map(([generator, view]) => `${generator}#${view}`).sort());
        expect(tuples.map(tuple => `${tuple.target.id}#${tuple.generatorId}#${tuple.viewId}`).sort())
            .toEqual(lineages.map(({targetId, generatorId, viewId}) => `${targetId}#${generatorId}#${viewId}`).sort());
        expect(pairs.reduce((sum, pair) => sum + cells(pair, false).length, 0)).toBe(11);
        expect(pairs.reduce((sum, pair) => sum + cells(pair, true).length, 0)).toBe(20);
        expect(tuples.reduce((sum, tuple) => sum + enumerateDependencyAuditSelections(tuple.plan).selections.length, 0)).toBe(53);
    });

    it.each(pairs.flatMap(pair => [false, true].map(sequence => ({pair, sequence}))))
    ('preserves all eight native starts and the one-draw conditional law for $pair.id sequence=$sequence', ({pair, sequence}) => {
        const generator = sequence ? new MeasurementUnitEquivalencesGenerator() : new MeasurementUnitEquivalenceGenerator();
        const random = vi.spyOn(randomModule, 'random');
        try {
            const covered = new Set<number>();
            for (const range of cells(pair, sequence)) {
                const allowed = starts.filter(start => JSON.stringify(bounds(sequence ? table(pair, start) : single(pair, start))) === JSON.stringify(range));
                for (let index = 0; index < allowed.length; index++) for (const offset of [1e-7, 0.5, 1 - 1e-7]) {
                    random.mockReset();
                    random.mockReturnValueOnce((index + offset) / allowed.length);
                    expect(generator.generate({unitPair: pair.id, range: createCanonicalNumericRange(range.upper, range.lower)}).data)
                        .toEqual(sequence ? table(pair, allowed[index]!) : single(pair, allowed[index]!));
                    expect(random).toHaveBeenCalledTimes(1);
                    covered.add(allowed[index]!);
                }
            }
            expect([...covered].sort((a, b) => a - b)).toEqual(starts);
        } finally { random.mockRestore(); }
    });

    it.each(pairs.map((pair, index) => ({pair, labels: unitLabels[index]!})))
    ('admits every future range cell and rejects the wrong complete family for $pair.id', ({pair, labels}) => {
        for (const viewId of [derivationView, smallerView, tableView]) {
            const sequence = viewId === tableView;
            const generator = generators.find(generator => generator.generatorId === (sequence ? tableId : singleId))!;
            const wrong = generators.find(generator => generator.generatorId === (sequence ? singleId : tableId))!;
            const view = views.find(view => view.viewId === viewId)!;
            for (const range of cells(pair, sequence)) {
                const target = {id: `future-unit-equivalence-${pair.id}-${viewId}-${JSON.stringify(range)}`, labels: [Area.UnitScaleRelation,
                    Scope.IntegerNumbers, ...labels, ...(sequence ? [Scope.ConversionTable, Ability.Formalization]
                        : [viewId === derivationView ? Ability.ConceptDerivation : Ability.ProcedureExecution]),
                    ...rangeLabels(range).map(label => `http://edugraph.io/edu/${label}`)]};
                expect(matchTarget(target, generator, view).matched).toBe(true);
                expect(matchTarget(target, wrong, view)).toEqual({matched: false, reason: 'incompatible-type'});
            }
        }
    });

    it('retains exact threshold boundaries and excludes response-slot counts from measurement quantities', () => {
        expect(bounds(single(pairs[5], 2))).toEqual({upper: 120, lower: 0});
        expect(bounds(single(pairs[3], 7))).toEqual({upper: 120, lower: 0});
        expect(bounds(table(pairs[0], 6))).toEqual({upper: 10000, lower: 5});
        expect(bounds(table(pairs[0], 7))).toEqual({upper: 100000, lower: 5});
        expect(bounds(single(pairs[0], 7))).toEqual({upper: 10000, lower: 0});
        const data = table(pairs[3], 5);
        expect(visible(render(tableView, data, false))).toContain('Complete the 2 blank entries');
        expect(bounds(data)).toEqual({upper: 1000, lower: 5});
    });

    it.each(pairs)('preserves the single unknowns, one-unit evidence and complete table for $id', pair => {
        for (const start of starts) {
            const data = single(pair, start), rows = table(pair, start), factor = formatStandardNumeral(pair.factor);
            const answer = formatStandardNumeral(start * pair.factor);
            const derivationQuestion = render(derivationView, data, false), derivationSolution = visible(render(derivationView, data, true));
            expect(derivationQuestion).toContain('Unresolved one-unit scale factor');
            expect(visible(derivationQuestion)).toContain(`1 ${pair.largerUnit} = ?`);
            expect(derivationSolution).toContain(`1 ${pair.largerUnit} = ${factor}`);
            expect(derivationSolution).toContain(`Dividing both counts by ${start}`);
            const question = visible(render(smallerView, data, false)), solution = visible(render(smallerView, data, true));
            expect(question).toContain(`1 ${pair.largerUnit} = ${factor}`);
            expect(question).toContain(`${start} × ${factor} = ?`);
            expect(question).not.toContain(`${start} × ${factor} = ${answer}`);
            expect(solution).toContain(`${start} × ${factor} = ${answer}`);
            for (const mode of [false, true]) {
                const markup = render(tableView, rows, mode);
                expect(markup.match(/Write /g) ?? []).toHaveLength(mode ? 0 : 2);
                expect(markup.match(/grid min-h-\[68px\]/g)).toHaveLength(5);
                expect(isValidUnitEquivalence(data)).toBe(true);
                expect(isValidUnitEquivalenceSequence(rows)).toBe(true);
                expect(isValidUnitEquivalence(rows as never)).toBe(false);
                expect(isValidUnitEquivalenceSequence(data as never)).toBe(false);
            }
        }
    });

    it.each(generatorIds)('keeps every both-mode runtime consumer boundary for %s', id => {
        const data = id === singleId ? single(pairs[0], 2) : id === tableId ? table(pairs[0], 2)
            : id === factorId ? {largeUnitCount: 5, smallUnitCount: 10, unitsPerLarge: 2}
                : id === countId ? {kind: 'generic-unit-count-relation', largeUnitCount: 5, smallUnitCount: 10}
                    : id === numericId ? numeric(pairs[0], false) : story(pairs[0], false, 'larger');
        for (const viewId of viewIds) for (const mode of [false, true]) {
            if (validPairs.some(([generator, view]) => generator === id && view === viewId)) expect(() => render(viewId, data, mode)).not.toThrow();
            else expect(() => render(viewId, data, mode)).toThrow(ViewValidationError);
        }
    });

    it.each(pairs)('retains numeric and story shared controls for $id', pair => {
        for (const mode of [false, true]) for (const decimal of [false, true]) {
            expect(render(numericView, numeric(pair, decimal), mode)).toContain('Convert in both directions');
            for (const side of ['larger', 'smaller'] as const) {
                const markup = render(storyView, story(pair, decimal, side), mode);
                expect(markup).toContain('Measurement story');
                expect(markup.includes('Blank conversion equation')).toBe(!mode);
                expect(markup.includes('Blank addition equation')).toBe(!mode);
            }
        }
    });

    it.each(lineages)('independently checks every selection and receipt replay for $targetId / $viewId', ({targetId, generatorId, viewId, pair, count}) => {
        const tuple = tuples.find(tuple => tuple.target.id === targetId && tuple.generatorId === generatorId && tuple.viewId === viewId)!;
        const generator = generators.find(generator => generator.generatorId === generatorId)!;
        const view = views.find(view => view.viewId === viewId)!;
        const enumeration = enumerateDependencyAuditSelections(tuple.plan);
        expect(enumeration.status).toBe('complete');
        expect(enumeration.selections).toHaveLength(count);
        for (const selection of enumeration.selections) for (let seed = 0; seed < 8; seed++) {
            const sampleKey = `${targetId}#${generatorId}#${viewId}#train#question#inst:0`;
            const input = {generator: generator.generator, generatorSpec: generator.spec, viewSchema: view.schema, viewSpec: view.spec,
                plan: tuple.plan, sampleKey, seed, attempt: 1, replay: {version: 1 as const, sampleKey, seed, attempt: 1,
                    selection: createGenerationSelectionReceipt(tuple.plan, selection.choices)}};
            const draw = generatePlannedDraw(input);
            expect(draw.stub).not.toBeNull();
            const data = draw.stub!.data as Named;
            expect(data.pair).toEqual(pair);
            expect(draw.labels.map(label => label.slice(label.lastIndexOf('/') + 1)).filter(label => /^Numbers(?:Smaller|Larger)\d+$/.test(label)).sort())
                .toEqual(rangeLabels(bounds(data)));
            expect(draw.labels).toContain(Scope.NumbersWithoutNegatives);
            expect(draw.labels).toContain(Scope.NumbersWithoutZero);
            expect(generatePlannedDraw(input)).toEqual(draw);
        }
    });
});
