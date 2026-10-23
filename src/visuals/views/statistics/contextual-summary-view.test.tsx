import {renderToStaticMarkup} from 'react-dom/server';
import {afterAll, beforeAll, describe, expect, it, vi} from 'vitest';
import {Ability, Area} from 'edugraph-ts';
import type {CompatibilityQueries} from '../../../types/compatibility.ts';
import type {ViewRenderPayload} from '../../../types/ml-engine.ts';
import type {NumericalDataProblem as Problem} from '../../../types/problems.ts';
import {buildNumericalDataProblem as build, isNumericalDataProblem as valid} from '../../../generators/statistics/numerical-data-helpers.ts';
import {ViewValidationError} from '../../helpers/validation.ts';
import {literalAllRelationInput} from './numerical-distribution-fixtures.ts';
import {summaryScalar as q, summarySixInput, summaryOddInput, summaryMadInput, summaryConstantInput,
    summaryZeroIqrInput, summaryCelsiusInput} from './summary-meaning-fixtures.ts';
import {contextualMadOracle, contextualCelsiusOracle} from './contextual-summary-fixtures.ts';
import {spec as center, ContextualCenterSummaryViewSchema} from './contextual-center-summary/spec.ts';
import {spec as variation, ContextualVariationSummaryViewSchema} from './contextual-variation-summary/spec.ts';

const ids = ['contextual-center-summary', 'contextual-variation-summary'] as const;
type Id = typeof ids[number];
type Core = (props: {config: {}; payload: ViewRenderPayload<Id>}) => React.ReactNode;
const cores = new Map<Id, Core>();
beforeAll(async () => {
    vi.stubGlobal('window', {});
    const [centerView, variationView] = await Promise.all([import('./contextual-center-summary/view.tsx'), import('./contextual-variation-summary/view.tsx')]);
    cores.set(ids[0], centerView.ContextualCenterSummaryCore); cores.set(ids[1], variationView.ContextualVariationSummaryCore);
});
afterAll(() => vi.unstubAllGlobals());
const render = (id: Id, data: Problem, solution: boolean): string => {
    const Component = cores.get(id)!;
    return renderToStaticMarkup(<Component config={{}} payload={{viewId: id, problem: {type: 'statistics', data, labels: []}, targetLabels: [], isSolutionView: solution, seed: 27}} />);
};
const text = (markup: string): string => markup.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
const queries = (generator: readonly string[], target: readonly string[]): CompatibilityQueries => ({
    has: (scope, label) => (scope === 'generator' ? generator : scope === 'target' ? target : []).includes(label),
    exact: (scope, label) => (scope === 'generator' ? generator : scope === 'target' ? target : []).includes(label)
});

describe('fixed contextual calculation and interpretation views', () => {
    it('owns both Abilities and requires the complete original task with exactly one summary claim', () => {
        for (const [spec, schema, area] of [[center, ContextualCenterSummaryViewSchema, Area.ArithmeticMean],
            [variation, ContextualVariationSummaryViewSchema, Area.MeanAbsoluteDeviation]] as const) {
            expect(new Set(spec.generalLabels)).toEqual(new Set([Ability.ProcedureExecution, Ability.Interpretation])); expect(schema).toEqual({});
            expect(spec.compatibility!.every(rule => rule.predicate(queries([area], [area, Ability.ProcedureExecution, Ability.Interpretation])))).toBe(true);
            for (const incomplete of [[area, Ability.Interpretation], [area, Ability.ProcedureExecution], [Ability.ProcedureExecution, Ability.Interpretation]]) {
                expect(spec.compatibility!.every(rule => rule.predicate(queries([area], incomplete)))).toBe(false);
            }
            expect(spec.compatibility!.every(rule => rule.predicate(queries([area, Area.EmpiricalDistributionShape], [area, Ability.ProcedureExecution, Ability.Interpretation])))).toBe(false);
        }
    });

    it('withholds requested center results, calculations and meaning in Q', () => {
        for (const kind of ['arithmetic-mean', 'median'] as const) {
            const question = render(ids[0], build({...summarySixInput, relations: [kind]}), false), visible = text(question);
            expect(visible).toContain(`Calculate the ${kind === 'arithmetic-mean' ? 'arithmetic mean' : 'median'}`);
            expect((question.match(/data-role="distribution-observation-dot"/g) ?? [])).toHaveLength(6);
            expect(question).toContain('contextual-summary-blank');
            expect(question).not.toMatch(/contextual-summary-answer|contextual-center-solution|contextual-mean-calculation|center-summary-given|variation-summary-given|distribution-summary-givens|emerald/);
            expect(visible).not.toMatch(/Given arithmetic|Given median|18 ÷ 6 = 3|Central positions|per-record numerical average|mean is 3|median is 5\/2/);
        }
    });

    it('sums every original observation, divides by N and interprets the actual mean in context', () => {
        const data = build(summarySixInput), solution = render(ids[0], data, true), visible = text(solution);
        expect(visible).toContain('1 + 2 + 2 + 3 + 4 + 6 = 18'); expect(visible).toContain('18 ÷ 6 = 3');
        expect(visible).toContain('Number of records: 6'); expect(visible).toContain('per-record numerical average of Recorded length');
        expect(visible).toContain('arithmetic mean is 3 centimeters'); expect(solution).toContain('text-emerald-800');
        expect(visible).not.toContain('18 ÷ 5');
    });

    it('preserves complete odd/even sorted-middle procedures and their contextual meanings', () => {
        const even = text(render(ids[0], build({...summarySixInput, relations: ['median']}), true));
        const odd = text(render(ids[0], build({...summaryOddInput, relations: ['median']}), true));
        expect(even).toContain('R1=1, R2=2, R3=2, R4=3, R5=4, R6=6');
        expect(even).toContain('Central positions: 3 and 4'); expect(even).toContain('(2 + 3) ÷ 2 = 5/2');
        expect(even).toContain('median is 5/2 centimeters'); expect(even).toContain('two central values are averaged');
        expect(odd).toContain('Central position: 3'); expect(odd).toContain('median is 3 centimeters');
    });

    it('withholds requested variation, completed distances and quartile values in Q', () => {
        for (const [input, method] of [[summaryMadInput, 'mean absolute deviation (MAD)'], [summaryOddInput, 'interquartile range (IQR)']] as const) {
            const question = render(ids[1], build(input), false), visible = text(question);
            expect(visible).toContain(`Calculate the ${method}`);
            expect(question).not.toMatch(/contextual-summary-answer|contextual-variation-solution|contextual-mad-distances|center-summary-given|variation-summary-given|distribution-summary-givens|emerald/);
            expect(visible).not.toMatch(/Given mean|Given interquartile|MAD is 21\/8|IQR is 5|Q1=|Q3=|distance reference|21 ÷ 8|Lower half:/);
        }
        expect(text(render(ids[1], build(summaryOddInput), false))).toContain('excluding the central observation when the record count is odd');
    });

    it('shows every signed and absolute MAD distance with multiplicity, the absolute sum and division', () => {
        const data = build(summaryMadInput), solution = render(ids[1], data, true), visible = text(solution);
        expect(data.summary.mean).toEqual(contextualMadOracle.mean); expect(data.summary.median.value).toEqual(q(3));
        expect(data.summary.deviations.map(row => row.signedDifference)).toEqual(contextualMadOracle.differences);
        expect(data.summary.deviations.map(row => row.absoluteDifference)).toEqual(contextualMadOracle.absolute);
        expect(data.summary.absoluteDeviationSum).toEqual(contextualMadOracle.absoluteSum); expect(data.summary.mad).toEqual(contextualMadOracle.mad);
        expect(visible).toContain('2 + 2 + 3 + 3 + 3 + 4 + 4 + 15 = 36'); expect(visible).toContain('36 ÷ 8 = 9/2');
        expect(visible).toContain('2 - (9/2) = -5/2'); expect(visible).toContain('|-5/2| = 5/2');
        expect(visible).toContain('15 - (9/2) = 21/2'); expect(visible).toContain('|21/2| = 21/2');
        expect(visible).toContain('(5/2) + (5/2) + (3/2) + (3/2) + (3/2) + (1/2) + (1/2) + (21/2) = 21');
        expect(visible).toContain('21 ÷ 8 = 21/8'); expect(visible).toContain('MAD is 21/8 centimeters');
        expect(visible).toContain('average absolute distance');
        const table = solution.match(/<table[^>]*data-role="contextual-mad-distances"[\s\S]*?<\/table>/)![0];
        expect((table.match(/<tr>/g) ?? [])).toHaveLength(9);
    });

    it('shows ordered halves, the excluded odd observation, both half medians and exact IQR', () => {
        const solution = text(render(ids[1], build(summaryOddInput), true));
        expect(solution).toContain('central observation R3=3 is excluded from both halves');
        expect(solution).toContain('Lower half: R1=1, R2=2'); expect(solution).toContain('Upper half: R4=4, R5=9');
        expect(solution).toContain('Q1, lower-half central positions 1 and 2: (1 + 2) ÷ 2 = 3/2');
        expect(solution).toContain('Q3, upper-half central positions 1 and 2: (4 + 9) ÷ 2 = 13/2');
        expect(solution).toContain('(13/2) - (3/2) = 5'); expect(solution).toContain('IQR is 5 centimeters');
        expect(solution).toContain('span of the middle half'); expect(solution).not.toMatch(/Tukey|fence|1\.5/);
        const even = text(render(ids[1], build({...summarySixInput, relations: ['interquartile-range']}), true));
        expect(even).toContain('Lower half: R1=1, R2=2, R3=2'); expect(even).toContain('Upper half: R4=3, R5=4, R6=6');
        expect(even).not.toContain('excluded from both halves');
    });

    it('accepts valid commuted central averages and ID-keyed MAD proof permutations', () => {
        const data = build(summaryMadInput), mad = data.relations[0];
        if (mad.kind !== 'mean-absolute-deviation') throw new Error('Expected the exact MAD fixture.');
        const reordered: Problem = {...data, relations: [{...mad, deviations: [...mad.deviations].reverse()}]};
        expect(valid(reordered)).toBe(true); expect(render(ids[1], reordered, true)).toBe(render(ids[1], data, true));
        const original = build({...summarySixInput, relations: ['median']}), proof = original.relations[0];
        if (proof.kind !== 'median' || proof.positional.arithmetic.kind !== 'central-pair-average') throw new Error('Expected even median proof.');
        const [first, second] = proof.positional.arithmetic.operands;
        const commuted: Problem = {...original, relations: [{...proof, positional: {...proof.positional,
            arithmetic: {...proof.positional.arithmetic, operands: [second, first]}}}]};
        expect(valid(commuted)).toBe(true); expect(text(render(ids[0], commuted, true))).toContain('(3 + 2) ÷ 2 = 5/2');
    });

    it('handles constant data and zero IQR with differing outer values truthfully', () => {
        const constant = text(render(ids[1], build({...summaryConstantInput, relations: ['mean-absolute-deviation']}), true));
        expect(constant).toContain('0 + 0 + 0 + 0 = 0'); expect(constant).toContain('0 ÷ 4 = 0');
        expect(constant).toContain('every absolute distance and the MAD are zero');
        const zeroIqr = text(render(ids[1], build(summaryZeroIqrInput), true));
        expect(zeroIqr).toContain('IQR is 0 centimeters'); expect(zeroIqr).toContain('outer recorded values can still differ');
    });

    it('retains exact signed Celsius calculations and nonnegative original-unit spread', () => {
        const data = build({...summaryCelsiusInput, relations: ['mean-absolute-deviation']}), centerData = build(summaryCelsiusInput);
        expect(data.summary.deviations.map(row => row.signedDifference)).toEqual(contextualCelsiusOracle.differences);
        expect(data.summary.deviations.map(row => row.absoluteDifference)).toEqual(contextualCelsiusOracle.absolute);
        expect(data.summary.absoluteDeviationSum).toEqual(contextualCelsiusOracle.absoluteSum); expect(data.summary.mad).toEqual(contextualCelsiusOracle.mad);
        const centerS = text(render(ids[0], centerData, true)), spreadS = text(render(ids[1], data, true));
        expect(centerS).toContain('(-1/2) ÷ 5 = -1/10'); expect(centerS).toContain('arithmetic mean is -1/10 degrees Celsius');
        expect(spreadS).toContain('MAD is 27/25 degrees Celsius'); expect(spreadS).not.toMatch(/share the temperature|pour|allocate the temperature/);
        expect(text(render(ids[0], centerData, false))).not.toContain('-1/10');
    });

    it('accepts every coherent relation family and uses stable top-level priorities or universal fallback', () => {
        const {replacement, ...source} = literalAllRelationInput;
        for (const kind of literalAllRelationInput.relations) {
            const data = build({...source, relations: [kind], ...(kind === 'single-record-replacement' ? {replacement} : {})});
            for (const id of ids) for (const solution of [false, true]) expect(() => render(id, data, solution)).not.toThrow();
        }
        const data = build(literalAllRelationInput), reversed: Problem = {...data, relations: [data.relations.at(-1)!, ...data.relations.slice(0, -1).reverse()]};
        expect(render(ids[0], data, false)).toBe(render(ids[0], reversed, false)); expect(render(ids[1], data, false)).toBe(render(ids[1], reversed, false));
        const fallback = build({...summarySixInput, relations: ['frequency-partition']});
        expect(text(render(ids[0], fallback, true))).toContain('18 ÷ 6 = 3'); expect(text(render(ids[1], fallback, true))).toContain('8 ÷ 6 = 4/3');
    });

    it('keeps broad two-anchor/asymmetric frames and source registry order without a sampler cap', () => {
        const input = {...summarySixInput, histogramEdges: [q(0), q(10), q(20)] as const,
            axes: {...summarySixInput.axes, value: {minimum: q(0), maximum: q(20), step: q(20), ticks: [q(0), q(20)], zeroIndex: 0}}};
        const data = build(input), permuted: Problem = {...data, study: {...data.study,
            units: [data.study.units.at(-1)!, ...data.study.units.slice(0, -1).reverse()]}};
        for (const id of ids) for (const solution of [false, true]) expect(() => render(id, permuted, solution)).not.toThrow();
    });

    it('rejects malformed payloads through the total guard in both fixed tasks', () => {
        const data = build(summarySixInput), bad: unknown[] = [{...data, kind: 'other'}, {...data, departureFacts: undefined},
            {...data, records: new Array(4)}, {...data, summary: {...data.summary, mean: q(4)}},
            {...data, plots: {...data.plots, dots: new Array(data.records.length)}}, {...data, relations: []}];
        for (const candidate of bad) for (const id of ids) expect(() => render(id, candidate as Problem, false)).toThrow(ViewValidationError);
    });
});
