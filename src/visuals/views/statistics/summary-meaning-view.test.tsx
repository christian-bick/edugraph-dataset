import {renderToStaticMarkup} from 'react-dom/server';
import {afterAll, beforeAll, describe, expect, it, vi} from 'vitest';
import {Ability, Area} from 'edugraph-ts';
import type {CompatibilityQueries} from '../../../types/compatibility.ts';
import type {ViewRenderPayload} from '../../../types/ml-engine.ts';
import type {NumericalDataProblem as Problem} from '../../../types/problems.ts';
import {buildNumericalDataProblem as build, isNumericalDataProblem as valid} from '../../../generators/statistics/numerical-data-helpers.ts';
import {ViewValidationError} from '../../helpers/validation.ts';
import {literalAllRelationInput} from './numerical-distribution-fixtures.ts';
import {spec as center, CenterSummaryInterpretationViewSchema} from './center-summary-interpretation/spec.ts';
import {spec as variation, VariationSummaryInterpretationViewSchema} from './variation-summary-interpretation/spec.ts';
import {centerSummaryKind, variationSummaryKind} from './summary-meaning-format.tsx';
import {centerSummaryEvidence, centerSummaryOriginalTask, variationSummaryEvidence, variationSummaryOriginalTask} from './summary-meaning-view-policy.ts';
import {summaryScalar as q, summaryLiteralInput, summarySixInput, summaryOddInput, summaryMadInput, summaryConstantInput,
    summaryZeroIqrInput, summaryCelsiusInput, summaryMeaningOracles} from './summary-meaning-fixtures.ts';

const ids = ['center-summary-interpretation', 'variation-summary-interpretation'] as const;
type Id = typeof ids[number];
type Core = (props: {config: {}; payload: ViewRenderPayload<Id>}) => React.ReactNode;
const cores = new Map<Id, Core>();
beforeAll(async () => {
    vi.stubGlobal('window', {});
    const [centerView, variationView] = await Promise.all([import('./center-summary-interpretation/view.tsx'), import('./variation-summary-interpretation/view.tsx')]);
    cores.set(ids[0], centerView.CenterSummaryInterpretationCore); cores.set(ids[1], variationView.VariationSummaryInterpretationCore);
});
afterAll(() => vi.unstubAllGlobals());
const render = (id: Id, data: Problem, solution: boolean): string => {
    const Component = cores.get(id)!;
    return renderToStaticMarkup(<Component config={{}} payload={{viewId: id, problem: {type: 'statistics', data, labels: []}, targetLabels: [], isSolutionView: solution, seed: 24}} />);
};
const text = (markup: string): string => markup.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
const queries = (generator: readonly string[], target: readonly string[] = []): CompatibilityQueries => ({
    has: (scope, label) => (scope === 'generator' ? generator : scope === 'target' ? target : []).includes(label),
    exact: (scope, label) => (scope === 'generator' ? generator : scope === 'target' ? target : []).includes(label)
});

describe('one-number statistical summary interpretation', () => {
    it('owns only Interpretation with empty schemas and original-task participation', () => {
        expect(center.generalLabels).toEqual([Ability.Interpretation]); expect(variation.generalLabels).toEqual([Ability.Interpretation]);
        expect(CenterSummaryInterpretationViewSchema).toEqual({}); expect(VariationSummaryInterpretationViewSchema).toEqual({});
        for (const label of [Area.ArithmeticMean, Area.Median]) {
            expect(centerSummaryOriginalTask.predicate(queries([], [label]))).toBe(true);
            expect(centerSummaryEvidence.predicate(queries([label]))).toBe(true);
        }
        for (const label of [Area.MeanAbsoluteDeviation, Area.InterquartileRange]) {
            expect(variationSummaryOriginalTask.predicate(queries([], [label]))).toBe(true);
            expect(variationSummaryEvidence.predicate(queries([label]))).toBe(true);
        }
        expect(centerSummaryOriginalTask.predicate(queries([Area.ArithmeticMean], [Ability.Interpretation]))).toBe(false);
        expect(variationSummaryOriginalTask.predicate(queries([Area.MeanAbsoluteDeviation], [Ability.Interpretation]))).toBe(false);
        for (const extra of [Area.EmpiricalDistributionShape, Area.StatisticalVariability, Area.Quartile, Area.FrequencyDistribution,
            Area.StatisticalSample, Area.NumerationWithIntegers, Area.StatisticalVariable, Area.StatisticalOutlier]) {
            expect(centerSummaryEvidence.predicate(queries([Area.ArithmeticMean, extra]))).toBe(false);
            expect(variationSummaryEvidence.predicate(queries([Area.MeanAbsoluteDeviation, extra]))).toBe(false);
        }
        expect(centerSummaryEvidence.predicate(queries([Area.ArithmeticMean, Area.Median]))).toBe(false);
        expect(variationSummaryEvidence.predicate(queries([Area.MeanAbsoluteDeviation, Area.InterquartileRange]))).toBe(false);
        expect(centerSummaryEvidence.predicate(queries([]))).toBe(false); expect(variationSummaryEvidence.predicate(queries([]))).toBe(false);
    });

    it('matches independent mean, median, MAD, half-median IQR and signed context oracles', () => {
        for (const [input, oracle] of [[summarySixInput, summaryMeaningOracles.six], [summaryOddInput, summaryMeaningOracles.odd],
            [summaryMadInput, summaryMeaningOracles.mad], [summaryConstantInput, summaryMeaningOracles.constant],
            [summaryCelsiusInput, summaryMeaningOracles.celsius]] as const) {
            const data = build(input); expect(valid(data)).toBe(true); expect(data.summary).toMatchObject(oracle);
        }
        const six = build(summarySixInput), odd = build(summaryOddInput), signed = build(summaryCelsiusInput);
        expect(six.summary.median.value).toEqual(q(5, 2)); expect(six.summary.quartiles).toMatchObject({q1: q(2), q3: q(4)});
        expect(odd.summary.quartiles).toMatchObject({q1: q(3, 2), q3: q(13, 2)});
        expect(signed.summary.median.value).toEqual(q(-1, 2));
    });

    it('gives one center in Q without its interpretation or an extra spread task', () => {
        const question = render(ids[0], build(summarySixInput), false), visible = text(question);
        expect(visible).toContain('Given arithmetic mean: 3 centimeters'); expect(visible).toContain('R2 U2 O1 2 R3 U3 O1 2');
        expect((question.match(/data-role="distribution-observation-dot"/g) ?? [])).toHaveLength(6);
        expect(question).toContain('summary-meaning-blank');
        expect(question).not.toMatch(/summary-meaning-answer|center-summary-meaning|variation-summary-given|distribution-summary-givens|emerald/);
        expect(visible).not.toMatch(/Given median|Given mean absolute|Given interquartile|per-record numerical average|divided by the|asymmetric|Qualifying departure/);
    });

    it('explains the actual mean as a contextual center rather than just arithmetic or a record count', () => {
        const solution = render(ids[0], build(summarySixInput), true), visible = text(solution);
        expect(visible).toContain('18 ÷ 6 = 3'); expect(visible).toContain('per-record numerical average');
        expect(visible).toContain('number of observations is 6'); expect(visible).toContain('Collections can share a center while having different spreads');
        expect(solution).toContain('text-emerald-800'); expect(solution).not.toContain('variation-summary-meaning');
    });

    it('distinguishes even and odd median meanings and retains duplicates', () => {
        const even = build({...summarySixInput, relations: ['median']}), odd = build({...summaryOddInput, relations: ['median']});
        const evenQ = text(render(ids[0], even, false)), evenS = text(render(ids[0], even, true)), oddS = text(render(ids[0], odd, true));
        expect(evenQ).toContain('Given median: 5/2 centimeters'); expect(evenQ).not.toContain('Central positions');
        expect(evenS).toContain('R2=2, R3=2'); expect(evenS).toContain('Central positions 3 and 4: (2 + 3) ÷ 2 = 5/2');
        expect(evenS).toContain('averages the two central values'); expect(oddS).toContain('Central position 3: 3');
        expect(oddS).not.toContain('With an even number');
    });

    it('gives only the selected variation value in Q and withholds its distance or quartile work', () => {
        const madQ = render(ids[1], build(summaryMadInput), false), iqrQ = render(ids[1], build(summaryOddInput), false);
        expect(text(madQ)).toContain('Given mean absolute deviation (MAD): 21/8 centimeters');
        expect(text(iqrQ)).toContain('Given interquartile range (IQR): 5 centimeters');
        expect(text(iqrQ)).toContain('excluding the central observation when the record count is odd');
        for (const markup of [madQ, iqrQ]) {
            expect(markup).not.toMatch(/center-summary-given|variation-summary-meaning|summary-meaning-answer|emerald/);
            expect(text(markup)).not.toMatch(/Absolute distances from|Lower-half middle|Q1=|average absolute distance|middle half under/);
        }
    });

    it('uses the arithmetic mean rather than the median as the MAD reference', () => {
        const data = build(summaryMadInput), solution = text(render(ids[1], data, true));
        expect(data.summary.median.value).toEqual(q(3)); expect(data.summary.mean).toEqual(q(9, 2));
        expect(solution).toContain('distance reference: 9/2 centimeters'); expect(solution).toContain('21 ÷ 8 = 21/8');
        expect(solution).toContain('average absolute distance'); expect(solution).toContain('rather than signed differences or distances from the median');
        expect(solution).not.toContain('distance reference: 3 centimeters');
    });

    it('interprets exact half-median quartiles and middle-half span without rounding to chart ticks', () => {
        const data = build(summaryOddInput), solution = text(render(ids[1], data, true));
        expect(data.plots.box.q1.axisPosition.denominator).toBeGreaterThan(1);
        expect(solution).toContain('(1 + 2) ÷ 2 = 3/2'); expect(solution).toContain('(4 + 9) ÷ 2 = 13/2');
        expect(solution).toContain('(13/2) - (3/2) = 5'); expect(solution).toContain('spread of the middle half');
        expect(solution).not.toMatch(/Tukey|fence|variance|full range is/);
    });

    it('handles zero MAD and zero IQR without claiming all zero-IQR observations coincide', () => {
        const constant = build({...summaryConstantInput, relations: ['mean-absolute-deviation']});
        expect(text(render(ids[1], constant, true))).toContain('all recorded values coincide');
        const varying = build(summaryZeroIqrInput); expect(varying.summary.iqr).toEqual(q(0));
        const solution = text(render(ids[1], varying, true));
        expect(solution).toContain('Values outside this middle-half span can still differ'); expect(solution).not.toContain('all recorded values coincide');
    });

    it('demonstrates that equal centers can coexist with different spreads using independent source literals', () => {
        const first = build(summaryLiteralInput([q(1), q(2), q(2), q(3)], ['mean-absolute-deviation']));
        const second = build(summaryLiteralInput([q(0), q(2), q(2), q(4)], ['mean-absolute-deviation']));
        for (const data of [first, second]) { expect(data.summary.mean).toEqual(q(2)); expect(data.summary.median.value).toEqual(q(2)); }
        expect(first.summary.mad).toEqual(q(1, 2)); expect(second.summary.mad).toEqual(q(1));
        expect(first.summary.iqr).toEqual(q(1)); expect(second.summary.iqr).toEqual(q(2));
        expect(text(render(ids[1], first, true))).toContain('MAD 1/2 centimeters');
        expect(text(render(ids[1], second, true))).toContain('MAD 1 centimeters');
    });

    it('retains signed Celsius meanings without pretending to physically allocate temperature', () => {
        const data = build(summaryCelsiusInput), centerS = text(render(ids[0], data, true));
        expect(centerS).toContain('arithmetic mean is -1/10 degrees Celsius'); expect(centerS).not.toMatch(/pour|share the temperature|allocate the temperature/);
        const variationS = text(render(ids[1], data, true));
        expect(variationS).toContain('MAD 27/25 degrees Celsius'); expect(variationS).toContain('distance reference: -1/10 degrees Celsius');
    });

    it('uses actual top-level priority regardless of proof order and truthful universal fallback', () => {
        const data = build(literalAllRelationInput), reversed: Problem = {...data, relations: [data.relations.at(-1)!, ...data.relations.slice(0, -1).reverse()]};
        for (const member of [data, reversed]) {
            expect(centerSummaryKind(member)).toBe('mean'); expect(variationSummaryKind(member)).toBe('mad');
            expect(text(render(ids[0], member, false))).toContain('Given arithmetic mean');
            expect(text(render(ids[1], member, false))).toContain('Given mean absolute deviation');
        }
        const nestedMedianOnly = build(summaryOddInput);
        expect(centerSummaryKind(nestedMedianOnly)).toBe('mean'); expect(variationSummaryKind(nestedMedianOnly)).toBe('iqr');
        const noSummary = build({...summarySixInput, relations: ['frequency-partition']});
        expect(centerSummaryKind(noSummary)).toBe('mean'); expect(variationSummaryKind(noSummary)).toBe('mad');
        expect(text(render(ids[0], noSummary, true))).toContain('18 ÷ 6 = 3');
        expect(text(render(ids[1], noSummary, true))).toContain('8 ÷ 6 = 4/3');
    });

    it('admits all twelve coherent relation families in both modes, two-tick scales and registry permutations', () => {
        const {replacement, ...source} = literalAllRelationInput;
        for (const selected of literalAllRelationInput.relations) {
            const data = build({...source, relations: [selected], ...(selected === 'single-record-replacement' ? {replacement} : {})});
            expect(valid(data)).toBe(true);
            for (const id of ids) for (const solution of [false, true]) expect(() => render(id, data, solution)).not.toThrow();
        }
        const input = {...summarySixInput, histogramEdges: [q(0), q(10), q(20)] as const,
            axes: {...summarySixInput.axes, value: {minimum: q(0), maximum: q(20), step: q(20), ticks: [q(0), q(20)], zeroIndex: 0}}};
        const data = build(input), permuted: Problem = {...data, study: {...data.study,
            units: [data.study.units.at(-1)!, ...data.study.units.slice(0, -1).reverse()]}};
        for (const id of ids) for (const solution of [false, true]) {
            expect(() => render(id, data, solution)).not.toThrow(); expect(() => render(id, permuted, solution)).not.toThrow();
        }
    });

    it('rejects malformed complete payloads through the full guard rather than narrowing selected families', () => {
        const data = build(summarySixInput);
        const bad: unknown[] = [{...data, kind: 'other'}, {...data, departureFacts: undefined}, {...data, relations: []},
            {...data, records: new Array(4)}, {...data, summary: {...data.summary, mean: q(4)}},
            {...data, plots: {...data.plots, dots: new Array(data.records.length)}}];
        for (const candidate of bad) for (const id of ids) expect(() => render(id, candidate as Problem, false)).toThrow(ViewValidationError);
    });

});
