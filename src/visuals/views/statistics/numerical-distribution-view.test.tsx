import {renderToStaticMarkup} from 'react-dom/server';
import {afterAll, beforeAll, describe, expect, it, vi} from 'vitest';
import {Ability, Area} from 'edugraph-ts';
import {buildNumericalDataProblem as build, isNumericalDataProblem as valid} from '../../../generators/statistics/numerical-data-helpers.ts';
import type {CompatibilityQueries} from '../../../types/compatibility.ts';
import type {ViewRenderPayload} from '../../../types/ml-engine.ts';
import type {NumericalDataProblem as Problem} from '../../../types/problems.ts';
import {ViewValidationError} from '../../helpers/validation.ts';
import {distributionScalar as q, literalAllRelationInput, literalCelsiusInput, literalConstantInput, literalDepartureInput, literalOddRecordInput, literalSixRecordInput, literalSummaryOracles, literalTallStackInput} from './numerical-distribution-fixtures.ts';
import {distributionSummaries} from './numerical-distribution-format.tsx';
import {NumericalDistributionPlot} from './numerical-distribution-plot.tsx';
import {distributionDescriptionEvidence, distributionPatternsEvidence} from './numerical-distribution-view-policy.ts';
import {spec as descriptionSpec, DistributionDescriptionViewSchema} from './distribution-description/spec.ts';
import {spec as patternsSpec, DistributionPatternsContextViewSchema} from './distribution-patterns-context/spec.ts';

const ids = ['distribution-description', 'distribution-patterns-context'] as const;
type Id = typeof ids[number];
type Core = (props: {config: {}; payload: ViewRenderPayload<Id>}) => React.ReactNode;
const cores = new Map<Id, Core>();
beforeAll(async () => {
    vi.stubGlobal('window', {});
    const values = await Promise.all([import('./distribution-description/view.tsx'), import('./distribution-patterns-context/view.tsx')]);
    cores.set(ids[0], values[0].DistributionDescriptionCore); cores.set(ids[1], values[1].DistributionPatternsContextCore);
});
afterAll(() => vi.unstubAllGlobals());
const render = (id: Id, data: Problem, solution: boolean): string => {
    const Component = cores.get(id)!;
    return renderToStaticMarkup(<Component config={{}} payload={{viewId: id, problem: {type: 'statistics', data, labels: []}, targetLabels: [], isSolutionView: solution, seed: 12}} />);
};
const text = (markup: string) => markup.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
function queries(generator: readonly string[], target: readonly string[] = []): CompatibilityQueries {
    return {has: (scope, label) => (scope === 'generator' ? generator : scope === 'target' ? target : []).includes(label),
        exact: (scope, label) => (scope === 'generator' ? generator : scope === 'target' ? target : []).includes(label)};
}
const meanBundle = [Area.EmpiricalDistributionShape, Area.StatisticalVariability, Area.ArithmeticMean, Area.MeanAbsoluteDeviation];
const medianBundle = [Area.EmpiricalDistributionShape, Area.StatisticalVariability, Area.Median, Area.InterquartileRange];
const patternBundle = [Area.EmpiricalDistributionShape, Area.StatisticalOutlier];

describe('fixed numerical distribution interpretation views', () => {
    it('declares fixed Interpretation tasks, empty schemas and genuine target/selected-bundle boundaries', () => {
        expect(descriptionSpec.generalLabels).toEqual([Ability.Interpretation]); expect(patternsSpec.generalLabels).toEqual([Ability.Interpretation]);
        expect(DistributionDescriptionViewSchema).toEqual({}); expect(DistributionPatternsContextViewSchema).toEqual({});
        expect(distributionDescriptionEvidence.predicate(queries(meanBundle))).toBe(true);
        expect(distributionDescriptionEvidence.predicate(queries(medianBundle))).toBe(true);
        expect(distributionPatternsEvidence.predicate(queries(patternBundle))).toBe(true);
        for (const rejected of [[Area.ArithmeticMean], patternBundle, [...meanBundle, Area.Median], [...meanBundle, Area.StatisticalVariable]]) expect(distributionDescriptionEvidence.predicate(queries(rejected))).toBe(false);
        for (const rejected of [meanBundle, [Area.StatisticalOutlier], [...patternBundle, Area.ArithmeticMean], [...patternBundle, Area.StatisticalVariability]]) expect(distributionPatternsEvidence.predicate(queries(rejected))).toBe(false);
        expect(descriptionSpec.compatibility![0].predicate(queries(meanBundle, [Area.ArithmeticMean, Ability.Interpretation]))).toBe(false);
        expect(patternsSpec.compatibility![0].predicate(queries(patternBundle, [Area.ArithmeticMean, Ability.Interpretation]))).toBe(false);
        expect(descriptionSpec.compatibility!.every(rule => rule.predicate(queries(meanBundle, meanBundle)))).toBe(true);
        expect(patternsSpec.compatibility!.every(rule => rule.predicate(queries(patternBundle, patternBundle)))).toBe(true);
    });
    it('matches independent exact duplicate-weight, odd-quartile, departure and constant oracles', () => {
        const six = build(literalSixRecordInput), odd = build(literalOddRecordInput), departure = build(literalDepartureInput), constant = build(literalConstantInput), celsius = build(literalCelsiusInput);
        for (const [data, oracle] of [[six, literalSummaryOracles.six], [departure, literalSummaryOracles.departure], [constant, literalSummaryOracles.constant], [celsius, literalSummaryOracles.celsius]] as const) {expect(valid(data)).toBe(true); expect(data.summary).toMatchObject(oracle);}
        expect(six.summary.median.value).toEqual(q(5, 2)); expect(six.summary.quartiles).toMatchObject({q1: q(2), q3: q(4)});
        expect(odd.summary.quartiles).toMatchObject({q1: q(3, 2), q3: q(13, 2)}); expect(odd.summary.iqr).toEqual(q(5));
        expect(odd.plots.box.q1.axisPosition).toEqual(q(3, 2)); expect(odd.plots.box.q3.axisPosition).toEqual(q(13, 2));
        expect(departure.departureFacts!.ordinaryRecordIds).toHaveLength(7);
        expect(departure.departureFacts!.separations[0]).toMatchObject({recordId: 'record-8', absoluteDifference: q(11), thresholdRelation: 'greater'});
    });
    it('shows every record and neutral given summaries in description Q without interpretation answers', () => {
        const data = build(literalSixRecordInput), question = render(ids[0], data, false);
        expect((question.match(/data-role="distribution-observation-dot"/g) ?? []).length).toBe(6);
        expect(text(question)).toContain('Given arithmetic mean: 3 centimeters');
        expect(text(question)).toContain('Given mean absolute deviation (MAD): 4/3 centimeters');
        expect(text(question)).toContain('R2 U2 O1 2 R3 U3 O1 2');
        expect(question).not.toMatch(/distribution-interpretation-answer|distribution-summary-meaning|distribution-shape-meaning|distribution-variability-meaning|emerald|asymmetric|symmetric about|record-1|frequency-1/);
        expect(question).toContain('distribution-interpretation-blank');
    });
    it('explains the mean/MAD, actual observed variation and finite shape in green S', () => {
        const solution = render(ids[0], build(literalSixRecordInput), true), visible = text(solution);
        expect(visible).toContain('18 ÷ 6 = 3'); expect(visible).toContain('8 ÷ 6 = 4/3');
        expect(visible).toContain('average absolute distance of the recorded values from their arithmetic mean');
        expect(visible).toContain('These different recorded values show observed variability');
        expect(visible).toContain('asymmetric about 7/2');
        expect(visible).toContain('frequency 2'); expect(visible).toContain('Consecutive occupied values and their separations');
        expect(solution).toContain('text-emerald-800'); expect(solution).not.toContain('distribution-interpretation-blank');
        expect(visible).not.toMatch(/right-skewed|left-skewed|modes|population is normal/);
    });
    it('preserves odd/even median and half-middle relations without rounding quantiles', () => {
        const odd = text(render(ids[0], build(literalOddRecordInput), true));
        expect(odd).toContain('Given median: 3 centimeters'); expect(odd).toContain('Given interquartile range (IQR): 5 centimeters');
        expect(odd).toContain('(1 + 2) ÷ 2 = 3/2'); expect(odd).toContain('(4 + 9) ÷ 2 = 13/2');
        expect(odd).toContain('(13/2) - (3/2) = 5'); expect(odd).toContain('middle half under this quartile convention');
        const even = build({...literalSixRecordInput, relations: ['empirical-shape', 'observed-variability', 'median', 'interquartile-range']});
        expect(text(render(ids[0], even, true))).toContain('Central positions 3 and 4: (2 + 3) ÷ 2 = 5/2');
    });
    it('gives a criterion without identifying outliers or revealing separation work in patterns Q', () => {
        const question = render(ids[1], build(literalDepartureInput), false), visible = text(question);
        expect(visible).toContain('Routine reference band: [2, 4] centimeters, including both endpoints');
        expect(visible).toContain('at least 3 centimeters'); expect(visible).toContain('strict majority');
        expect(question).not.toMatch(/distribution-departure-dot|distribution-departure-meaning|distribution-shape-meaning|emerald|Qualifying departure|absolute gap|nearestOrdinary|record-8/);
        expect(visible).not.toContain('15 - 4 = 11');
    });
    it('identifies the actual majority, closest empirical gap and qualifying departure in patterns S', () => {
        const solution = render(ids[1], build(literalDepartureInput), true), visible = text(solution);
        expect((solution.match(/data-role="distribution-departure-dot"/g) ?? []).length).toBe(1);
        expect(visible).toContain('The in-band majority consists of R1=2, R2=2, R3=3, R4=3, R5=3, R6=4, R7=4');
        expect(visible).toContain('R8=15 is outside the routine band'); expect(visible).toContain('15 - 4 = 11; absolute gap = 11 centimeters');
        expect(visible).toContain('Qualifying departure: R8=15 centimeters');
        expect(visible).not.toMatch(/1\.5|Tukey|fence|IQR/);
    });
    it('handles threshold equality, a valid nonqualifying departure and absent criteria truthfully', () => {
        const equal = build({...literalDepartureInput, departureCriterion: {...literalDepartureInput.departureCriterion!, minimumSeparation: q(11)}});
        expect(text(render(ids[1], equal, true))).toContain('gap is equal to the required 11 centimeters');
        const noDeparture = build({...literalDepartureInput, departureCriterion: {...literalDepartureInput.departureCriterion!, minimumSeparation: q(12)}, relations: ['empirical-shape']});
        expect(text(render(ids[1], noDeparture, true))).toContain('No recorded observation meets both parts');
        const none = render(ids[1], build(literalConstantInput), true);
        expect(text(none)).toContain('no departure criterion was specified'); expect(none).not.toContain('distribution-departure-dot');
    });
    it('accepts constant data without inventing a spread, variability witness or multiple peaks', () => {
        const data = build(literalConstantInput), solution = text(render(ids[0], data, true));
        expect(solution).toContain('Given mean absolute deviation (MAD): 0 centimeters');
        expect(solution).toContain('this collection has no observed variability'); expect(solution).toContain('There is a single occupied value');
        expect(solution).not.toMatch(/show observed variability|mode|several peaks/);
    });
    it('projects signed half-step positions and frequency positions directly from the payload', () => {
        const data = build(literalCelsiusInput), markup = renderToStaticMarkup(<NumericalDistributionPlot data={data} highlightedRecordIds={[]} />);
        const circles = [...markup.matchAll(/cx="([^"]+)" cy="([^"]+)" r="5\.5"/g)].map(match => [Number(match[1]), Number(match[2])]);
        expect(data.plots.dots[0].valueLocation.axisPosition).toEqual(q(1, 2));
        expect(data.plots.dots[0].stackLocation.axisPosition).toEqual(q(1, 2));
        expect(circles[0]).toEqual([64 + 610 / 8, 24 + 170 - 170 / 4]);
        expect(text(markup)).toContain('Temperature (degrees Celsius)'); expect(text(markup)).toContain('frequency step: 2');
    });
    it('keeps every dot separate in a twenty-observation stack with only two count anchors', () => {
        const data = build(literalTallStackInput);
        expect(valid(data)).toBe(true); expect(data.summary).toMatchObject({count: 20, sum: q(60), mean: q(3), mad: q(0)});
        const markup = renderToStaticMarkup(<NumericalDistributionPlot data={data} highlightedRecordIds={[]} />);
        const centers = [...markup.matchAll(/cx="([^"]+)" cy="([^"]+)" r="5\.5"/g)].map(match => [Number(match[1]), Number(match[2])]);
        expect(centers).toHaveLength(20); expect(new Set(centers.map(row => row[0])).size).toBe(1);
        const heights = centers.map(row => row[1]).sort((a, b) => a - b);
        for (let index = 1; index < heights.length; index++) expect(heights[index] - heights[index - 1]).toBeGreaterThanOrEqual(14);
        for (const id of ids) for (const solution of [false, true]) expect(render(id, data, solution)).toContain('distribution-observed-plot');
    });
    it('chooses actual top-level proof kinds with stable priority independent of array order', () => {
        const data = build(literalAllRelationInput), changed: Problem = {...data, relations: [data.relations.at(-1)!, ...data.relations.slice(0, -1).reverse()]};
        expect(valid(changed)).toBe(true); expect(distributionSummaries(data)).toEqual({center: 'mean', spread: 'mad'});
        for (const id of ids) for (const solution of [false, true]) expect(render(id, changed, solution)).toBe(render(id, data, solution));
        const median = build({...literalOddRecordInput, relations: ['interquartile-range']});
        expect(distributionSummaries(median)).toEqual({center: 'mean', spread: 'iqr'});
    });
    it('both fixed cores accept every selected relation family and broad two-tick frames off-target', () => {
        const full = build(literalAllRelationInput);
        for (const proof of full.relations) {
            const data: Problem = {...full, relations: [proof]}; expect(valid(data)).toBe(true);
            for (const id of ids) for (const solution of [false, true]) expect(render(id, data, solution)).not.toMatch(/NaN|undefined|Infinity|□|→/);
        }
        const wide = build({...literalDepartureInput, axes: {value: {minimum: q(0), maximum: q(16), step: q(16), ticks: [q(0), q(16)], zeroIndex: 0}, count: {minimum: q(0), maximum: q(8), step: q(8), ticks: [q(0), q(8)], zeroIndex: 0}}});
        for (const id of ids) for (const solution of [false, true]) expect(render(id, wide, solution)).toContain('distribution-observed-plot');
    });
    it('retains repeated occasions and distinguishes equal display names without exposing IDs', () => {
        const source = literalSixRecordInput, units = [{id: 'one-unit', name: 'Sam'}] as const;
        const occasions = source.records.map((_, index) => ({id: `occasion-${index}`, name: 'Check'}));
        const rows = source.records.map((row, index) => ({...row, unitId: 'one-unit', occasionId: occasions[index].id}));
        const data = build({...source, study: {...source.study, units, selection: 'repeated-occasions', occasions: [occasions[0], ...occasions.slice(1)]}, records: [rows[0], rows[1], rows[2], rows[3], ...rows.slice(4)]});
        const visible = text(render(ids[0], data, true));
        expect(visible).toContain('U1: Sam'); expect(visible).toContain('O1: Check; O2: Check');
        expect(visible).toContain('R1 U1 O1 1 R2 U1 O2 2'); expect(visible).not.toContain('one-unit');
    });
    it('rejects malformed data, holes, incorrect positions and false proofs through ViewValidationError', () => {
        const changes: ((data: any) => void)[] = [value => {delete value.kind;}, value => {delete value.departureFacts;}, value => {value.records = new Array(6);},
            value => {value.summary.mean.numerator = 4;}, value => {value.plots.dots[0].valueLocation.axisPosition.numerator = 6;},
            value => {value.frequencies[0].recordIds = ['not-a-record'];}, value => {value.relations = new Array(1);}, value => {value.shapeFacts.maximumFrequency = 100;}];
        for (const change of changes) {const data = structuredClone(build(literalSixRecordInput)); change(data); expect(valid(data)).toBe(false); for (const id of ids) expect(() => render(id, data, false)).toThrow(ViewValidationError);}
    });
});
