import {renderToStaticMarkup} from 'react-dom/server';
import {describe, expect, it} from 'vitest';
import type {RatioTableComparisonProblem, RatioTableProblem} from '../../../types/problems.ts';
import type {ViewRenderPayload} from '../../../types/ml-engine.ts';
import {assertRatioComparison, assertRatioPlotScale, assertRatioTable} from './ratio-table-helpers.ts';
import {RatioTableComparisonView, RatioTableView} from './ratio-table-view.tsx';

const table = (base: [number, number] = [2, 5], scales = [1, 2, 3, 4]): RatioTableProblem => ({
    kind: 'ratio-table',
    quantities: [{name: 'flour', unit: 'cups'}, {name: 'water', unit: 'cups'}],
    base,
    rows: scales.map(scale => ({antecedent: base[0] * scale, consequent: base[1] * scale, scale})),
    coordinateScale: {xStep: base[0], yStep: base[1], xMax: base[0] * 5, yMax: base[1] * 5}
});

const payload = (solution: boolean): ViewRenderPayload<'ratio-table-construction'> => ({
    problem: {type: 'comparison', data: table(), labels: []},
    viewId: 'ratio-table-construction', targetLabels: [], isSolutionView: solution, seed: 23
});

const text = (markup: string) => markup.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ');

describe('ratio table projections', () => {
    it('withholds complete construction rows and reveals a possible set of equivalent pairs', () => {
        const questionMarkup = renderToStaticMarkup(<RatioTableView task="construction" payload={payload(false)} viewId="ratio-table-construction" />);
        const solutionMarkup = renderToStaticMarkup(<RatioTableView task="construction" payload={payload(true)} viewId="ratio-table-construction" />);
        const question = text(questionMarkup);
        const solution = text(solutionMarkup);
        expect(question).toContain('Add 3 different rows');
        expect(question.match(/\?/g)).toHaveLength(6);
        expect(question).not.toContain('6 : 15');
        expect(solution).toContain('One possible table');
        expect(solution).toContain('2 : 5 = 4 : 10 = 6 : 15 = 8 : 20');
        expect(questionMarkup).not.toContain('text-emerald-800');
        expect(solutionMarkup.match(/text-emerald-800/g)).toHaveLength(6);
        expect(solutionMarkup).toMatch(/text-emerald-800[^>]*>6<\/td>/);
        expect(solutionMarkup).toMatch(/text-slate-900[^>]*>2<\/td>/);
    });

    it('asks for an inverse value in each column without exposing the withheld entries', () => {
        const questionMarkup = renderToStaticMarkup(<RatioTableView task="missing-values" payload={payload(false)} viewId="ratio-table-missing-values" />);
        const solutionMarkup = renderToStaticMarkup(<RatioTableView task="missing-values" payload={payload(true)} viewId="ratio-table-missing-values" />);
        const question = text(questionMarkup);
        const solution = text(solutionMarkup);
        expect(question.match(/\?/g)).toHaveLength(2);
        expect(question).not.toMatch(/\b6\b|\b20\b/);
        expect(solution).toContain('6 : 15');
        expect(solution).toContain('8 : 20');
        expect(questionMarkup).not.toContain('text-emerald-800');
        expect(solutionMarkup.match(/text-emerald-800/g)).toHaveLength(2);
        expect(solutionMarkup).toMatch(/text-emerald-800[^>]*>6<\/td>/);
        expect(solutionMarkup).toMatch(/text-emerald-800[^>]*>20<\/td>/);
        expect(solutionMarkup).toMatch(/text-slate-900[^>]*>15<\/td>/);
    });

    it('retains the complete table and scaled axes while withholding only plotted points', () => {
        const question = renderToStaticMarkup(<RatioTableView task="plotting" payload={payload(false)} viewId="ratio-coordinate-plotting" />);
        const solution = renderToStaticMarkup(<RatioTableView task="plotting" payload={payload(true)} viewId="ratio-coordinate-plotting" />);
        expect(question).not.toContain('<circle');
        expect(solution.match(/<circle/g)).toHaveLength(4);
        expect(text(question)).toContain('x: flour (cups)');
        expect(text(question)).toContain('y: water (cups)');
        expect(text(question)).toContain('25');
        expect(text(solution)).toContain('(6, 15)');
        expect(question).not.toContain('#059669');
        expect(solution.match(/<circle[^>]*fill="#059669"/g)).toHaveLength(4);
        expect(solution.match(/fill="#065f46"/g)).toHaveLength(4);
        expect(solution).not.toContain('text-emerald-800');
    });

    it('rejects missing fields, incoherent pairs, duplicate rows, and unbounded grids', () => {
        expect(() => assertRatioTable('table', undefined as never)).toThrow('missing');
        const valid = table();
        for (const invalid of [
            {...valid, rows: undefined},
            {...valid, kind: 'other'},
            {...valid, base: [0, 5]},
            {...valid, quantities: [{name: '', unit: 'cups'}, valid.quantities[1]]},
            {...valid, rows: [{antecedent: 1, consequent: 2, scale: 1}, ...valid.rows.slice(1)]},
            {...valid, rows: [valid.rows[0], valid.rows[0]]},
            {...valid, coordinateScale: {...valid.coordinateScale, xStep: 0}},
            {...valid, coordinateScale: {...valid.coordinateScale, xMax: 2}}
        ]) {
            expect(() => assertRatioTable('table', invalid as RatioTableProblem)).toThrow();
        }
        expect(() => assertRatioTable('table', valid)).not.toThrow();
        expect(() => assertRatioPlotScale('plot', {...valid, coordinateScale: {...valid.coordinateScale, xMax: 1000}})).toThrow('ten steps');
    });
});

const comparison = (relation: RatioTableComparisonProblem['relation']): RatioTableComparisonProblem => {
    const left = table([2, 3]);
    const right = relation === 'less' ? table([3, 4], [1, 2, 3])
        : relation === 'greater' ? table([1, 3]) : table([2, 3], [1, 2, 4]);
    return {kind: 'ratio-table-comparison', left, right, relation,
        normalized: {consequent: 12, leftAntecedent: 8, rightAntecedent: right.rows.at(-1)!.antecedent}};
};

describe('ratio table comparison', () => {
    it.each(['less', 'equal', 'greater'] as const)('compares %s ratios at a common consequent', relation => {
        const data = comparison(relation);
        const comparisonPayload: ViewRenderPayload<'ratio-table-comparison'> = {
            ...payload(false), viewId: 'ratio-table-comparison', problem: {type: 'comparison', data, labels: []}
        };
        const questionMarkup = renderToStaticMarkup(<RatioTableComparisonView payload={comparisonPayload} />);
        const question = text(questionMarkup);
        const solutionMarkup = renderToStaticMarkup(<RatioTableComparisonView payload={{...comparisonPayload, isSolutionView: true}} />);
        const solution = text(solutionMarkup);
        expect(questionMarkup.match(/border-amber-500/g)).toHaveLength(2);
        expect(question).toContain('less / equal / greater = ?');
        expect(solution).toContain('For 12 cups of water');
        expect(solution).toContain(relation === 'equal' ? 'as ratio B' : 'than ratio B');
        expect(solution).toContain(relation === 'equal' ? '8 = 8' : relation === 'less' ? '8 &lt; 9' : '8 &gt; 4');
        expect(questionMarkup).not.toContain('text-emerald-800');
        expect(solutionMarkup.match(/text-emerald-800/g)).toHaveLength(2);
        expect(solutionMarkup).toMatch(/text-emerald-800[^>]*>8<\/td>/);
        expect(solutionMarkup).toMatch(new RegExp(`text-emerald-800[^>]*>${data.normalized.rightAntecedent}</td>`));
    });

    it('rejects incorrect common quantities, relation witnesses, and mismatched quantity order', () => {
        const valid = comparison('less');
        for (const invalid of [
            {...valid, relation: 'greater'},
            {...valid, normalized: {...valid.normalized, consequent: 24}},
            {...valid, normalized: {...valid.normalized, leftAntecedent: 4}},
            {...valid, right: {...valid.right, quantities: [...valid.right.quantities].reverse()}}
        ]) {
            expect(() => assertRatioComparison('comparison', invalid as RatioTableComparisonProblem)).toThrow();
        }
    });
});
