import {renderToStaticMarkup} from 'react-dom/server';
import {afterAll, beforeAll, describe, expect, it, vi} from 'vitest';
import type {PlaceValueArithmeticProblem, PlaceValueDigits} from '../../../../types/problems.ts';
import {PlaceValueArithmeticModelCore} from '../place-value-arithmetic-model-view.tsx';

type ViewId = 'place-value-arithmetic-model' | 'place-value-arithmetic-written-method' | 'place-value-arithmetic-explanation';
const viewIds: readonly ViewId[] = ['place-value-arithmetic-model', 'place-value-arithmetic-written-method', 'place-value-arithmetic-explanation'];
let Explanation: typeof import('./view.tsx').PlaceValueArithmeticExplanationCore;
beforeAll(async () => {
    vi.stubGlobal('window', {});
    Explanation = (await import('./view.tsx')).PlaceValueArithmeticExplanationCore;
});
afterAll(() => vi.unstubAllGlobals());

const digits = (value: number): PlaceValueDigits => ({hundreds: Math.floor(value / 100), tens: Math.floor(value % 100 / 10), ones: value % 10});
function subtraction(num1: number, num2: number, wholeTens = false): PlaceValueArithmeticProblem {
    return {num1, num2, answer: num1 - num2, operation: 'subtraction', operandProfile: wholeTens ? 'multiples-of-ten' : 'general',
        operands: [digits(num1), digits(num2)], result: digits(num1 - num2),
        regrouping: {kind: 'none', onesBefore: num1 % 10, onesAfter: (num1 - num2) % 10, tensExchanged: 0},
        strategySteps: [{kind: 'subtract-ones', place: 'ones'}, {kind: 'subtract-tens', place: 'tens'}, {kind: 'result', place: 'result'}]};
}

function markup(data: PlaceValueArithmeticProblem, solution: boolean, viewId: ViewId = 'place-value-arithmetic-explanation') {
    const payload = {problem: {type: 'arithmetic' as const, data, labels: []}, targetLabels: [], seed: 4, isSolutionView: solution};
    if (viewId === 'place-value-arithmetic-explanation') {
        return renderToStaticMarkup(<Explanation config={{}} payload={{...payload, viewId}} />);
    }
    return renderToStaticMarkup(<PlaceValueArithmeticModelCore mode={viewId === 'place-value-arithmetic-model' ? 'blocks' : 'written-method'}
        payload={{...payload, viewId}} viewId={viewId} />);
}
const text = (html: string) => html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');

describe('complete place-value strategy evidence', () => {
    it('requires the complete place strategy for168−156 and reveals its zero hundreds only in Solution', () => {
        const data = subtraction(168, 156);
        const question = markup(data, false);
        const solution = markup(data, true);
        expect(text(question)).toContain('Explain how the hundreds, tens and ones combine or separate, including empty places and any regrouping.');
        expect(question).not.toContain('place-value-result-counts');
        expect(text(question)).not.toContain('0 hundreds');
        expect(text(question)).not.toMatch(/\b12\b/);
        expect(text(solution)).toContain('Result by place: 0 hundreds, 1 ten, 2 ones.');
        expect(text(solution)).toContain('8 − 6 = 2');
        expect(text(solution)).toContain('160 − 150 = 10');
        expect(text(solution)).toContain('10 + 2 = 12');
        expect(solution.match(/<li /g)).toHaveLength(3);
    });

    it.each(viewIds)('retains the zero hundreds of the result in %s', viewId => {
        const data = subtraction(168, 156);
        expect(text(markup(data, true, viewId))).toContain('0 hundreds');
        expect(text(markup(data, false, viewId))).not.toContain('0 hundreds');
    });

    it.each(viewIds)('keeps a nonzero coefficient control free of added zero quantities in %s', viewId => {
        const data = subtraction(587, 243);
        for (const solution of [false, true]) expect(text(markup(data, solution, viewId))).not.toMatch(/\b0\b/);
        expect(text(markup(data, true, viewId))).toContain('344');
    });

    it.each(viewIds)('preserves the positive whole-tens exception in %s', viewId => {
        const data = subtraction(30, 10, true);
        for (const solution of [false, true]) {
            const rendered = markup(data, solution, viewId);
            expect(rendered).not.toContain('place-value-result-counts');
            expect(text(rendered)).not.toMatch(/\b0\b/);
        }
        if (viewId === 'place-value-arithmetic-explanation') {
            const question = text(markup(data, false, viewId));
            expect(question).toContain('Explain how the tens are subtracted and how they give the result.');
            expect(question).not.toContain('empty places');
        }
    });

    it.each(viewIds)('retains explicit empty-result quantities for equality in %s', viewId => {
        const solution = text(markup(subtraction(30, 30, true), true, viewId));
        expect(solution).toContain('0 hundreds');
        expect(solution).toContain('0 tens');
        expect(solution).toContain('0 ones');
    });
});
