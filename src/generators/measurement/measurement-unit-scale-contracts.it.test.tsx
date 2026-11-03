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
import type {GenericUnitCountRelationProblem, GenericUnitScaleRelationProblem, MeasurementConversionPair,
    MeasurementConversionStoryProblem, MeasurementConversionValuesProblem, UnitEquivalenceSequenceProblem} from '../../types/problems.ts';
import {ViewValidationError} from '../../visuals/helpers/validation.ts';
import {MeasureConversionTableCore} from '../../visuals/views/measure/measure-conversion-table-view.tsx';
import {MeasureConversionBidirectionalView, MeasureConversionDerivationView, MeasureConversionToSmallerView} from '../../visuals/views/measurement/measure-conversion-view.tsx';
import {MeasurementUnitCountRelationsGenerator} from './measurement-unit-count-relations/generator.ts';
import {MeasurementUnitScaleGenerator} from './measurement-unit-scale/generator.ts';

const countId = 'measurement-unit-count-relations', factorId = 'measurement-unit-scale';
const namedId = 'measurement-unit-equivalences', numericId = 'measurement-conversion-values', storyId = 'measurement-conversion-problems';
const countView = 'measure-unit-scale-relation', factorView = 'measure-conversion-derivation';
const smallerView = 'measure-conversion-to-smaller', tableView = 'measure-conversion-table';
const numericView = 'measure-conversion-bidirectional', storyView = 'measure-conversion-problems';
const generatorIds = [countId, factorId, namedId, numericId, storyId];
const viewIds = [countView, factorView, smallerView, tableView, numericView, storyView];
const validPairs = [[countId, countView], [factorId, factorView], [namedId, factorView], [namedId, smallerView],
    [namedId, tableView], [numericId, numericView], [storyId, storyView]] as const;
const lineages = [
    ['2.MD.A.2-unit-scale-relation~bcfa4087', countId, countView, 4],
    ['2.MD.A.2-unit-scale-relation~bcfa4087', factorId, factorView, 2]
] as const;
type Generic = GenericUnitCountRelationProblem | GenericUnitScaleRelationProblem;
type Frame = {large: number; factor: number};
const native: Frame[] = [3, 4, 5, 6].flatMap(large => [2, 3].map(factor => ({large, factor})));
const fixture = ({large, factor}: Frame, withFactor: boolean): Generic => withFactor
    ? {largeUnitCount: large, smallUnitCount: large * factor, unitsPerLarge: factor}
    : {kind: 'generic-unit-count-relation', largeUnitCount: large, smallUnitCount: large * factor};

/** Independent integer-count oracle; deriving the factor adds its actual numerical value. */
function bounds(data: Generic): {upper: number; lower: number} {
    const values = [BigInt(data.largeUnitCount), BigInt(data.smallUnitCount)];
    expect(data.smallUnitCount === data.largeUnitCount * 2 || data.smallUnitCount === data.largeUnitCount * 3).toBe(true);
    if ('unitsPerLarge' in data) {
        expect(BigInt(data.largeUnitCount) * BigInt(data.unitsPerLarge)).toBe(BigInt(data.smallUnitCount));
        values.push(BigInt(data.unitsPerLarge));
    } else expect(data.kind).toBe('generic-unit-count-relation');
    const thresholds = [5, 10, 20, 100, 120, 1000, 10000, 100000, 1000000];
    values.sort((a, b) => a < b ? -1 : a > b ? 1 : 0);
    const upper = thresholds.find(value => values.at(-1)! <= BigInt(value))!;
    const lower = thresholds.findLast(value => values[0]! >= BigInt(value)) ?? 0;
    expect(lower).toBeLessThan(upper);
    return {upper, lower};
}
const rangeLabels = ({upper, lower}: {upper: number; lower: number}): string[] =>
    [`NumbersSmaller${upper}`, ...(lower ? [`NumbersLarger${lower}`] : [])].sort();

const pairs = [
    {id: 'kilometer-meter', quantityKind: 'length', scalingKind: 'magnitude', largerUnit: 'kilometer', smallerUnit: 'meter', factor: 1000},
    {id: 'meter-centimeter', quantityKind: 'length', scalingKind: 'magnitude', largerUnit: 'meter', smallerUnit: 'centimeter', factor: 100},
    {id: 'kilogram-gram', quantityKind: 'weight', scalingKind: 'magnitude', largerUnit: 'kilogram', smallerUnit: 'gram', factor: 1000},
    {id: 'pound-ounce', quantityKind: 'weight', scalingKind: 'factor', largerUnit: 'pound', smallerUnit: 'ounce', factor: 16},
    {id: 'liter-milliliter', quantityKind: 'liquid-volume', scalingKind: 'magnitude', largerUnit: 'liter', smallerUnit: 'milliliter', factor: 1000},
    {id: 'hour-minute', quantityKind: 'time', scalingKind: 'factor', largerUnit: 'hour', smallerUnit: 'minute', factor: 60},
    {id: 'minute-second', quantityKind: 'time', scalingKind: 'factor', largerUnit: 'minute', smallerUnit: 'second', factor: 60}
] as const satisfies readonly MeasurementConversionPair[];
const sequence = (pair: MeasurementConversionPair): UnitEquivalenceSequenceProblem => ({pair,
    equivalents: [2, 3, 4, 5, 6].map(largerValue => ({largerValue, smallerValue: largerValue * pair.factor}))});
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
    cores.set(countView, (await import('../../visuals/views/measure/measure-unit-scale-relation/view.tsx')).MeasureUnitScaleRelationCore);
    cores.set(factorView, MeasureConversionDerivationView);
    cores.set(smallerView, MeasureConversionToSmallerView);
    cores.set(tableView, MeasureConversionTableCore);
    cores.set(numericView, MeasureConversionBidirectionalView);
    cores.set(storyView, (await import('../../visuals/views/measurement/measure-conversion-problems/view.tsx')).MeasureConversionProblemsCore);
    tuples = matchTargets(await loadMatchingTargets('ccss'), generators, views).tuples.filter(tuple => [countId, factorId].includes(tuple.generatorId));
});
afterAll(() => vi.unstubAllGlobals());
const render = (viewId: string, data: unknown, solution: boolean): string => renderToStaticMarkup(cores.get(viewId)!({config: {}, payload: {
    viewId, problem: {type: 'measurement', data, labels: []}, targetLabels: [], isSolutionView: solution, seed: 42
}} as never));
const visible = (markup: string): string => markup.replace(/<[^>]*>/g, ' ').replace(/&gt;/g, '>').replace(/&lt;/g, '<')
    .replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();

describe('unit count comparison and factor derivation contract integration', () => {
    it('keeps all seven nominal pairs across five producers and six leaves', () => {
        expect(buildCompatibleModulePairIndex(generators, views).orderedPairs.map(pair => `${pair.generator.generatorId}#${pair.view.viewId}`).sort())
            .toEqual(validPairs.map(([generator, view]) => `${generator}#${view}`).sort());
        expect(tuples.map(tuple => `${tuple.target.id}#${tuple.generatorId}#${tuple.viewId}`).sort())
            .toEqual(lineages.map(([target, generator, view]) => `${target}#${generator}#${view}`).sort());
        expect(tuples.reduce((sum, tuple) => sum + enumerateDependencyAuditSelections(tuple.plan).selections.length, 0)).toBe(6);
    });

    it.each([false, true])('preserves all eight native pairs and the two-draw law with factor=%s', withFactor => {
        const generator = withFactor ? new MeasurementUnitScaleGenerator() : new MeasurementUnitCountRelationsGenerator();
        const signatures = [...new Set(native.map(frame => JSON.stringify(bounds(fixture(frame, withFactor)))))];
        expect(signatures).toHaveLength(withFactor ? 2 : 4);
        const random = vi.spyOn(randomModule, 'random');
        try {
            for (const signature of signatures) {
                const range = JSON.parse(signature) as {upper: number; lower: number};
                const rows = native.filter(frame => JSON.stringify(bounds(fixture(frame, withFactor))) === signature);
                for (const frame of rows) {
                    const sameLarge = rows.filter(candidate => candidate.large === frame.large);
                    const earlier = rows.filter(candidate => candidate.large < frame.large).length;
                    const factorIndex = sameLarge.findIndex(candidate => candidate.factor === frame.factor);
                    const intervals = [[earlier / rows.length, (earlier + sameLarge.length) / rows.length],
                        [factorIndex / sameLarge.length, (factorIndex + 1) / sameLarge.length]] as const;
                    const middle = intervals.map(([low, high]) => (low + high) / 2);
                    const probes = [middle, ...intervals.flatMap(([low, high], index) => [
                        middle.map((point, i) => i === index ? low + (high - low) * 1e-7 : point),
                        middle.map((point, i) => i === index ? high - (high - low) * 1e-7 : point)
                    ])];
                    for (const draws of probes) {
                        random.mockReset();
                        for (const draw of draws) random.mockReturnValueOnce(draw);
                        expect(generator.generate({range: createCanonicalNumericRange(range.upper, range.lower)}).data).toEqual(fixture(frame, withFactor));
                        expect(random).toHaveBeenCalledTimes(2);
                    }
                }
            }
        } finally { random.mockRestore(); }
    });

    it('derives minimum and maximum descriptors from both counts and the actually required factor', () => {
        expect(native.map(frame => rangeLabels(bounds(fixture(frame, false))))).toEqual([
            ['NumbersSmaller10'], ['NumbersSmaller10'], ['NumbersSmaller10'], ['NumbersSmaller20'],
            ['NumbersLarger5', 'NumbersSmaller10'], ['NumbersLarger5', 'NumbersSmaller20'],
            ['NumbersLarger5', 'NumbersSmaller20'], ['NumbersLarger5', 'NumbersSmaller20']
        ]);
        for (const frame of native) {
            const comparison = bounds(fixture(frame, false)), derivation = bounds(fixture(frame, true));
            expect(derivation.upper).toBe(comparison.upper);
            expect(derivation.lower).toBe(0);
        }
    });

    it.each([false, true])('admits every future range cell while enforcing the nominal boundary with factor=%s', withFactor => {
        const generator = generators.find(generator => generator.generatorId === (withFactor ? factorId : countId))!;
        const wrong = generators.find(generator => generator.generatorId === (withFactor ? countId : factorId))!;
        const view = views.find(view => view.viewId === (withFactor ? factorView : countView))!;
        for (const signature of new Set(native.map(frame => JSON.stringify(bounds(fixture(frame, withFactor)))))) {
            const range = JSON.parse(signature) as {upper: number; lower: number};
            const labels = rangeLabels(range).map(label => `http://edugraph.io/edu/${label}`);
            const target = {id: `future-unit-relation-${withFactor}-${signature}`, labels: [Area.UnitScaleRelation,
                Scope.SegmentScale, Scope.IntegerNumbers, Ability.ConceptDerivation, ...labels]};
            expect(matchTarget(target, generator, view).matched).toBe(true);
            expect(matchTarget(target, wrong, view)).toEqual({matched: false, reason: 'incompatible-type'});
        }
    });

    it.each(native)('keeps comparison qualitative and makes factor derivation explicit for $large times $factor', frame => {
        const counts = fixture(frame, false), factor = fixture(frame, true), small = frame.large * frame.factor;
        const question = visible(render(countView, counts, false)), solution = visible(render(countView, counts, true));
        expect(question).toContain('Which unit size needs more units to cover the same length?');
        expect(question).not.toMatch(/×|scale factor|Smaller units need a larger count:/);
        expect(solution).toContain(`Smaller units need a larger count: ${small} > ${frame.large}.`);
        const factorQuestion = visible(render(factorView, factor, false)), factorSolution = visible(render(factorView, factor, true));
        expect(factorQuestion).toContain('Find the scale factor from large-unit counts to small-unit counts');
        expect(factorQuestion).toContain(`${frame.large} × □ = ${small}`);
        expect(factorQuestion).toContain('Conclusion: ______ units need a larger count.');
        expect(factorQuestion).not.toContain(`${frame.large} × ${frame.factor} = ${small}`);
        expect(factorSolution).toContain(`${frame.large} × ${frame.factor} = ${small}`);
        for (const mode of [false, true]) {
            expect(render(countView, counts, mode).match(/last:border-r-0/g)).toHaveLength(frame.large + small);
            expect(render(factorView, factor, mode).match(/last:border-r-0/g)).toHaveLength(frame.large + small);
        }
    });

    it.each(generatorIds)('enforces both-mode runtime acceptance for the complete %s consumer family', id => {
        const data = id === countId ? fixture(native[0]!, false) : id === factorId ? fixture(native[0]!, true)
            : id === namedId ? sequence(pairs[0]) : id === numericId ? numeric(pairs[0], false) : story(pairs[0], false, 'larger');
        for (const viewId of viewIds) for (const solution of [false, true]) {
            if (validPairs.some(([generator, view]) => generator === id && view === viewId)) expect(() => render(viewId, data, solution)).not.toThrow();
            else expect(() => render(viewId, data, solution)).toThrow(ViewValidationError);
        }
    });

    it.each(pairs)('preserves every named-unit, numeric and story arm for $id', pair => {
        const data = sequence(pair);
        for (const solution of [false, true]) {
            const derivation = render(factorView, data, solution), smaller = render(smallerView, data, solution), table = render(tableView, data, solution);
            expect(derivation).toContain('Common-quantity evidence');
            expect(derivation.includes('Unresolved one-unit scale factor')).toBe(!solution);
            expect(smaller).toContain('Convert to a smaller unit');
            expect(table).toContain('Complete the two-column conversion table');
            expect(table.match(/Write /g) ?? []).toHaveLength(solution ? 0 : 2);
            for (const decimal of [false, true]) {
                expect(render(numericView, numeric(pair, decimal), solution)).toContain('Convert in both directions');
                for (const side of ['larger', 'smaller'] as const) {
                    const markup = render(storyView, story(pair, decimal, side), solution);
                    expect(markup).toContain('Measurement story');
                    expect(markup.includes('Blank conversion equation')).toBe(!solution);
                    expect(markup.includes('Blank addition equation')).toBe(!solution);
                }
            }
        }
    });

    it.each(lineages)('independently verifies all range selections and receipt replays for %s / %s / %s', (targetId, generatorId, viewId, count) => {
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
            expect(draw.labels.map(label => label.slice(label.lastIndexOf('/') + 1)).filter(label => /^Numbers(?:Smaller|Larger)\d+$/.test(label)).sort())
                .toEqual(rangeLabels(bounds(draw.stub!.data as Generic)));
            expect(draw.labels).toContain(Scope.NumbersWithoutNegatives);
            expect(draw.labels).toContain(Scope.NumbersWithoutZero);
            expect(generatePlannedDraw(input)).toEqual(draw);
        }
    });
});
