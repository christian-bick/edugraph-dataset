import {renderToStaticMarkup} from 'react-dom/server';
import {afterAll, beforeAll, describe, expect, it, vi} from 'vitest';
import type {ViewRenderPayload} from '../../../types/ml-engine.ts';
import type {NumericalDataProblem as Problem} from '../../../types/problems.ts';
import {buildNumericalDataProblem as build, isNumericalDataProblem as valid} from '../../../generators/statistics/numerical-data-helpers.ts';
import {ViewValidationError} from '../../helpers/validation.ts';
import {distributionScalar as q} from './numerical-distribution-fixtures.ts';
import {numericalConstructionFixtures as fixtures, numericalConstructionOracles as oracles} from './numerical-distribution-construction-fixtures.ts';
import type {NumericalDisplay} from './numerical-distribution-construction-format.tsx';
import {NumericalConstructionPlot} from './numerical-distribution-construction-plot.tsx';

const id = 'numerical-distribution-plot';
type Payload = ViewRenderPayload<typeof id>;
let Core: typeof import('./numerical-distribution-plot/view.tsx').NumericalDistributionPlotCore;
beforeAll(async () => {vi.stubGlobal('window', {}); Core = (await import('./numerical-distribution-plot/view.tsx')).NumericalDistributionPlotCore;});
afterAll(() => vi.unstubAllGlobals());
const payload = (data: Problem, isSolutionView: boolean): Payload => ({viewId: id, problem: {type: 'statistics', data, labels: []}, targetLabels: [], seed: 17, isSolutionView});
const render = (data: Problem, plot: NumericalDisplay, solution: boolean) => renderToStaticMarkup(<Core config={{plot}} payload={payload(data, solution)} />);
const visible = (markup: string) => markup.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
const elements = (markup: string, tag: string, role: string) => [...markup.matchAll(new RegExp(`<${tag}\\b[^>]*data-role="${role}"[^>]*>`, 'g'))].map(row => row[0]);
const attribute = (markup: string, name: string) => Number(markup.match(new RegExp(`\\b${name}="([^"]+)"`))![1]);
const plots = ['line-plot', 'histogram', 'box-plot'] as const;

describe('fixed numerical display construction', () => {
    it('keeps the raw observations and conventions while withholding every graphical and numeric solution in Q', () => {
        const data = build(fixtures.six);
        for (const plot of plots) {
            const question = render(data, plot, false), text = visible(question);
            expect(text).toContain('Construct a'); expect(text).toContain('R2 U2 O1 2 R3 U3 O1 2');
            expect(question).toContain('Empty scaled space for the requested numerical display');
            expect(question).not.toMatch(/constructed-observation|constructed-bin|constructed-box|numerical-construction-work|numerical-frequency-work|numerical-box-work|emerald/);
            expect(text).not.toMatch(/Given median|Given arithmetic mean|Lower-half middle|Ordered records/);
        }
        expect(visible(render(data, 'histogram', false))).toContain('[0, 2); [2, 4); [4, 6]');
        expect(visible(render(data, 'box-plot', false))).toContain('excluding the central observation when the count is odd');
    });
    it('uses one green solution dot per raw record, preserving repeated-value multiplicity', () => {
        const data = build(fixtures.six), solution = render(data, 'line-plot', true);
        const dots = elements(solution, 'circle', 'constructed-observation');
        expect(dots).toHaveLength(6); expect(dots.every(dot => dot.includes('fill="#047857"'))).toBe(true);
        const repeated = dots.filter(dot => attribute(dot, 'cx') === 64 + 2 * 610 / 6);
        expect(repeated).toHaveLength(2); expect(new Set(repeated.map(dot => attribute(dot, 'cy'))).size).toBe(2);
        expect(visible(solution)).toContain('R2, R3'); expect(solution).toContain('numerical-frequency-work');
    });
    it('draws touching histogram bars with exact supplied frequencies and closes only the final bin', () => {
        const data = build(fixtures.six), solution = render(data, 'histogram', true);
        expect(data.plots.histogram.bins.map(bin => bin.count)).toEqual(oracles.sixBinCounts);
        const bars = elements(solution, 'rect', 'constructed-bin'); expect(bars).toHaveLength(3);
        for (let index = 1; index < bars.length; index++) expect(attribute(bars[index - 1], 'x') + attribute(bars[index - 1], 'width')).toBeCloseTo(attribute(bars[index], 'x'), 10);
        bars.forEach((bar, index) => expect(attribute(bar, 'height')).toBeCloseTo(170 * oracles.sixBinCounts[index] / 6, 10));
        expect(visible(solution)).toContain('[4, 6]'); expect(visible(solution)).toContain('only the final bin includes its upper endpoint');
    });
    it('retains empty bins as zero-height supplied bars and frequency-zero rows', () => {
        const data = build(fixtures.emptyBins), solution = render(data, 'histogram', true);
        expect(data.plots.histogram.bins.map(bin => bin.count)).toEqual(oracles.constantBinCounts);
        const bars = elements(solution, 'rect', 'constructed-bin'); expect(bars).toHaveLength(3);
        expect(attribute(bars[0], 'height')).toBe(0); expect(attribute(bars[2], 'height')).toBe(0);
        expect(visible(solution)).toContain('[0, 2) none 0'); expect(visible(solution)).toContain('[4, 6] none 0');
    });
    it('keeps inter-tick odd quartiles exact and shows their ordered-half work only in S', () => {
        const data = build(fixtures.odd), solution = render(data, 'box-plot', true), text = visible(solution);
        expect([data.plots.box.minimum, data.plots.box.q1, data.plots.box.median, data.plots.box.q3, data.plots.box.maximum].map(row => row.value)).toEqual(oracles.oddFiveNumbers);
        expect(data.plots.box.q1.axisPosition).toEqual(q(3, 2)); expect(data.plots.box.q3.axisPosition).toEqual(q(13, 2));
        expect(text).toContain('(1 + 2) ÷ 2 = 3/2'); expect(text).toContain('(4 + 9) ÷ 2 = 13/2');
        expect(text).toContain('Minimum 1; Q1 3/2; median 3; Q3 13/2; maximum 9');
        expect(solution).toContain('data-role="constructed-box"'); expect(solution).toContain('text-emerald-800');
    });
    it('accepts signed fractional values and a zero-width constant box without fabricating fences or outliers', () => {
        const signed = build(fixtures.celsius), constant = build(fixtures.constant);
        expect([signed.plots.box.minimum, signed.plots.box.q1, signed.plots.box.median, signed.plots.box.q3, signed.plots.box.maximum].map(row => row.value)).toEqual(oracles.celsiusFiveNumbers);
        for (const data of [signed, constant]) for (const plot of plots) for (const mode of [false, true]) expect(render(data, plot, mode)).not.toMatch(/NaN|Infinity|undefined|Tukey|fence/);
        const markup = renderToStaticMarkup(<NumericalConstructionPlot data={constant} plot="box-plot" isSolutionView />);
        expect(markup).toContain('width="0"'); expect(visible(render(signed, 'box-plot', true))).toContain('degrees Celsius');
    });
    it('accepts all twelve individual selected proof families in every display and mode', () => {
        const full = build(fixtures.all); expect(full.relations).toHaveLength(12);
        for (const proof of full.relations) {
            const member: Problem = {...full, relations: [proof]}; expect(valid(member)).toBe(true);
            for (const plot of plots) for (const mode of [false, true]) expect(render(member, plot, mode)).toContain('numerical-construction-plot');
        }
    });
    it('uses supplied rational positions on broad two-tick scales and separates all twenty stacked records', () => {
        const data = build(fixtures.tall), solution = render(data, 'line-plot', true);
        const dots = elements(solution, 'circle', 'constructed-observation'); expect(dots).toHaveLength(20);
        const heights = dots.map(dot => attribute(dot, 'cy')).sort((a, b) => a - b);
        for (let index = 1; index < heights.length; index++) expect(heights[index] - heights[index - 1]).toBeGreaterThanOrEqual(14);
        expect(visible(solution)).toContain('frequency step: 20');
        const wide = build({...fixtures.six, axes: {value: {minimum: q(0), maximum: q(6), step: q(6), ticks: [q(0), q(6)], zeroIndex: 0},
            count: {minimum: q(0), maximum: q(6), step: q(6), ticks: [q(0), q(6)], zeroIndex: 0}}});
        for (const plot of plots) for (const mode of [false, true]) expect(render(wide, plot, mode)).not.toMatch(/NaN|undefined/);
    });
    it('reserves the complete first long-rational anchor in every convention without shifting its mathematical position', () => {
        const data = build(fixtures.longFirstAnchor), denominator = 9007199254740991;
        expect(valid(data)).toBe(true);
        expect(data.summary.sum).toEqual(q(-9007199254740988, denominator));
        expect(data.summary.mean).toEqual(q(-2251799813685247, denominator));
        const label = '-2251799813685247/9007199254740991';
        for (const plot of plots) for (const mode of [false, true]) {
            const markup = render(data, plot, mode);
            const tick = [...markup.matchAll(/<text\b([^>]*)>([^<]*)<\/text>/g)].find(row => row[2] === label);
            expect(tick).toBeDefined();
            const anchor = attribute(`<text${tick![1]}>`, 'x');
            expect(anchor - label.length * 4).toBeGreaterThanOrEqual(12);
            expect(anchor).toBeGreaterThan(64);
            if (plot === 'line-plot' && mode) {
                const dots = elements(markup, 'circle', 'constructed-observation');
                expect(dots).toHaveLength(4); expect(dots.every(dot => attribute(dot, 'cx') === anchor)).toBe(true);
            }
            expect(markup).not.toMatch(/NaN|Infinity/);
        }
    });
    it('preserves complete ID-keyed permutations and deterministic rendering', () => {
        const original = build(fixtures.all), changed: Problem = {...original, relations: [original.relations.at(-1)!, ...original.relations.slice(0, -1).reverse()],
            frequencies: [original.frequencies.at(-1)!, ...original.frequencies.slice(0, -1).reverse()]};
        expect(valid(changed)).toBe(true);
        for (const plot of plots) for (const mode of [false, true]) {
            const first = render(changed, plot, mode); expect(first).toBe(render(changed, plot, mode));
            expect(first).toContain('numerical-construction-plot');
        }
    });
    it('rejects missing or incoherent math and malformed resolved conventions at the leaf boundary', () => {
        const data = build(fixtures.six), wrong: Problem = {...data, plots: {...data.plots, box: {...data.plots.box, q1: {...data.plots.box.q1, value: q(17)}}}};
        expect(() => render(wrong, 'box-plot', false)).toThrow(ViewValidationError);
        expect(() => Core({config: {plot: 'unknown'} as never, payload: payload(data, false)})).toThrow(ViewValidationError);
        expect(() => Core({config: {plot: 'line-plot'}, payload: {...payload(data, false), problem: {type: 'statistics', data: {} as never, labels: []}}})).toThrow(ViewValidationError);
    });
});
