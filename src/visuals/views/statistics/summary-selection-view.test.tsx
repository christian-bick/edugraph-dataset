import {renderToStaticMarkup} from 'react-dom/server';
import {afterAll, beforeAll, describe, expect, it, vi} from 'vitest';
import type {NumericalDataProblem as Problem, NumericalDataSummaryCore} from '../../../types/problems.ts';
import type {ViewRenderPayload} from '../../../types/ml-engine.ts';
import {buildNumericalDataProblem as build, isNumericalDataProblem as valid} from '../../../generators/statistics/numerical-data-helpers.ts';
import {ViewValidationError} from '../../helpers/validation.ts';
import {summaryReplacement} from './summary-selection-format.tsx';
import {selectionFixtures as fixtures, selectionOracles as oracles} from './summary-selection-fixtures.ts';
import {distributionScalar as q} from './numerical-distribution-fixtures.ts';

const id = 'statistical-summary-selection';
let Core: typeof import('./statistical-summary-selection/view.tsx').StatisticalSummarySelectionCore;
beforeAll(async () => {vi.stubGlobal('window', {}); Core = (await import('./statistical-summary-selection/view.tsx')).StatisticalSummarySelectionCore;});
afterAll(() => vi.unstubAllGlobals());
const payload = (data: Problem, isSolutionView: boolean): ViewRenderPayload<typeof id> => ({viewId: id, problem: {type: 'statistics', data, labels: []}, targetLabels: [], seed: 37, isSolutionView});
const render = (data: Problem, solution: boolean) => renderToStaticMarkup(<Core config={{}} payload={payload(data, solution)} />);
const visible = (markup: string) => markup.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
const values = (summary: NumericalDataSummaryCore) => [summary.mean, summary.median.value, summary.mad, summary.iqr];

describe('purpose-based statistical summary applicability', () => {
    it('matches independent actual counterfactual summary and finite-change oracles', () => {
        for (const name of ['tokens', 'waiting', 'journeys'] as const) {
            const data = build(fixtures[name]), proof = summaryReplacement(data)!;
            expect(valid(data)).toBe(true); expect(values(data.summary)).toEqual(oracles[name].original);
            expect(values(proof.modified)).toEqual(oracles[name].modified);
            expect(proof.changes.map(row => row.absoluteDifference)).toEqual(oracles[name].changes);
            expect(proof.centerChangeRelation).toBe(oracles[name].center); expect(proof.spreadChangeRelation).toBe(oracles[name].spread);
        }
    });
    it('keeps purpose, both actual datasets and all candidate values neutral in Q while withholding suitability and work', () => {
        const question = render(build(fixtures.tokens), false), text = visible(question);
        expect(text).toContain('per-observation average that retains the recorded additive total');
        expect(text).toContain('Documented counterfactual: replace R5=7 with 2 items');
        expect(text).toContain('Arithmetic mean 3 2'); expect(text).toContain('Interquartile range (IQR) 9/2 2');
        expect(question).toContain('summary-selection-response'); expect(question).toContain('summary-selection-candidates');
        expect(question).not.toMatch(/summary-suitability-answer|summary-selection-answer|summary-selection-sensitivity|summary-selection-method-work|emerald|One suitable pair|Choose the arithmetic mean/);
        expect((question.match(/data-role="distribution-observation-dot"/g) ?? []).length).toBe(5);
        expect(text).toContain('Original recorded distribution');
    });
    it('chooses a total-preserving center for allocation and preserves the actual IQR-greater-than-MAD sensitivity reversal', () => {
        const solution = render(build(fixtures.tokens), true), text = visible(solution);
        expect(text).toContain('Choose the arithmetic mean 3 items for the center'); expect(text).toContain('Choose MAD 2 items');
        expect(text).toContain('This purpose does not require one unique spread summary');
        expect(text).toContain('The absolute change in MAD is less than the absolute change in IQR');
        expect(text).toContain('absolute change 6/5'); expect(text).toContain('absolute change 5/2');
        expect(text).toContain('physical distribution of whole items needs its own feasibility conditions');
        expect(solution).toContain('text-emerald-800'); expect(solution).not.toContain('summary-selection-response');
    });
    it('relates a middle-based choice to the routine-member purpose without claiming universal stability', () => {
        const solution = render(build(fixtures.waiting), true), text = visible(solution);
        expect(text).toContain('One suitable pair is median 3 minutes and IQR 3/2 minutes');
        expect(text).toContain('The absolute change in the mean is greater than the absolute change in the median');
        expect(text).toContain('The absolute change in MAD is greater than the absolute change in IQR');
        expect(text).toContain('Other replacements or other collections can produce different changes');
        expect(text).not.toMatch(/always best|unaffected by outliers|normal distribution|right-skewed|delete|error/);
    });
    it('reports equal center changes honestly when the purpose permits alternative summaries', () => {
        const text = visible(render(build(fixtures.journeys), true));
        expect(text).toContain('One suitable pair is arithmetic mean 3 minutes and MAD 3/2 minutes');
        expect(text).toContain('Median 3 minutes and IQR 3 minutes provide a defensible alternative');
        expect(text).toContain('The absolute change in the mean is equal to the absolute change in the median');
        expect(text).not.toContain('The absolute change in the mean is greater than');
    });
    it('projects all four original and modified methods, actual shape, and signed modified-minus-original work', () => {
        const solution = render(build(fixtures.tokens), true), text = visible(solution);
        expect((solution.match(/data-role="summary-selection-method-work"/g) ?? []).length).toBe(2);
        expect(text).toContain('Original summary evidence'); expect(text).toContain('Counterfactual summary evidence');
        expect(text).toContain('15 ÷ 5 = 3'); expect(text).toContain('10 ÷ 5 = 2');
        expect(text).toContain('counterfactual minus original'); expect(text).toContain('2 - 3 = -1');
        expect(text).toContain('absolute distance from the arithmetic mean'); expect(text).toContain('span of the middle half');
        expect(solution).toContain('distribution-shape-meaning'); expect(text).not.toMatch(/modes|Tukey|fence/);
        expect((solution.match(/data-role="distribution-observed-plot"/g) ?? []).length).toBe(1);
    });
    it('accepts constant, signed Celsius and zero-IQR varying-outer records without inventing counterfactuals', () => {
        for (const name of ['constant', 'celsius', 'zeroIqr'] as const) {
            const data = build(fixtures[name]); expect(valid(data)).toBe(true); expect(summaryReplacement(data)).toBeUndefined();
            for (const mode of [false, true]) {
                const markup = render(data, mode); expect(markup).toContain('summary-selection-candidates');
                expect(markup).not.toMatch(/summary-replacement-given|Counterfactual summary evidence|summary-selection-sensitivity|NaN|Infinity|undefined/);
            }
        }
        expect(visible(render(build(fixtures.celsius), true))).toContain('degrees Celsius');
        expect(visible(render(build(fixtures.zeroIqr), true))).toContain('observations outside that middle-half span can still differ');
    });
    it('keeps full long-rational candidates and record values in fixed-width wrappable columns', () => {
        const data = build(fixtures.longRational), proof = summaryReplacement(data)!;
        expect(valid(data)).toBe(true); expect(data.summary.mean).toEqual(q(2251799813685245, 2251799813685246));
        expect(data.summary.median.value).toEqual(data.summary.mean);
        expect(proof.modified.mean).toEqual(q(1125899906842622, 1125899906842623));
        expect(proof.modified.median.value).toEqual(data.summary.mean);
        expect(proof.modified.mad).toEqual(q(1, 1501199875790164)); expect(proof.modified.iqr).toEqual(q(1, 1125899906842623));
        for (const mode of [false, true]) {
            const markup = render(data, mode), candidates = markup.match(/data-role="summary-selection-candidates"[\s\S]*?<\/section>/)![0];
            const records = markup.match(/data-role="summary-selection-records"[\s\S]*?<\/table>/)![0];
            for (const table of [candidates, records]) {expect(table).toContain('table-fixed'); expect(table).toContain('overflow-wrap:anywhere');}
            expect(candidates).toContain('width:36%'); expect(candidates).toContain('width:32%');
            expect(records).toContain('width:34%');
            expect(candidates).toContain('2251799813685245/2251799813685246');
            expect(candidates).toContain('1125899906842622/1125899906842623');
            expect(records).toContain('2251799813685241/2251799813685246');
            expect(markup).not.toMatch(/NaN|undefined|Infinity/);
        }
    });
    it('accepts every individual mathematical relation family and keeps proof-order independent selection', () => {
        const full = build(fixtures.all);
        for (const proof of full.relations) {
            const member: Problem = {...full, relations: [proof]}; expect(valid(member)).toBe(true);
            for (const mode of [false, true]) expect(render(member, mode)).not.toMatch(/NaN|undefined|Infinity/);
        }
        const data = build(fixtures.tokens), reordered: Problem = {...data, relations: [data.relations.at(-1)!, ...data.relations.slice(0, -1).reverse()]};
        expect(valid(reordered)).toBe(true); for (const mode of [false, true]) expect(render(reordered, mode)).toBe(render(data, mode));
    });
    it('preserves valid commuted central-pair work instead of rebuilding a canonical operand order', () => {
        const data = build(fixtures.journeys), median = data.relations.find(row => row.kind === 'median')!;
        if (median.positional.arithmetic.kind !== 'central-pair-average') throw Error('Independent even-count fixture must have paired central operands.');
        const [first, second] = median.positional.arithmetic.operands;
        const changed: Problem = {...data, relations: [
            {...median, positional: {...median.positional, arithmetic: {...median.positional.arithmetic, operands: [second, first]}}},
            ...data.relations.filter(row => row.kind !== 'median')
        ]};
        expect(valid(changed)).toBe(true); expect(visible(render(changed, true))).toContain('(4 + 2) ÷ 2 = 3');
    });
    it('rejects malformed summaries and invalid record linkage through the complete leaf guard', () => {
        const data = build(fixtures.tokens), wrong: Problem = {...data, summary: {...data.summary, count: 13}};
        expect(() => render(wrong, false)).toThrow(ViewValidationError);
        expect(() => Core({config: {}, payload: {...payload(data, false), problem: {type: 'statistics', data: {} as never, labels: []}}})).toThrow(ViewValidationError);
    });
});
