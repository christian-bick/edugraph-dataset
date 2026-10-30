import {renderToStaticMarkup} from 'react-dom/server';
import {afterAll, beforeAll, describe, expect, it, vi} from 'vitest';
import type {ViewRenderPayload} from '../../../../types/ml-engine.ts';
import type {StandardMultiplicationProblem} from '../../../../types/problems.ts';
import {multiplicationCase} from './fixtures.ts';

let OperationsMultiplicationStandardAlgorithmCore: typeof import('./view.tsx').OperationsMultiplicationStandardAlgorithmCore;
beforeAll(async () => {
    vi.stubGlobal('window', {});
    OperationsMultiplicationStandardAlgorithmCore = (await import('./view.tsx')).OperationsMultiplicationStandardAlgorithmCore;
});
afterAll(() => vi.unstubAllGlobals());

function render(data: StandardMultiplicationProblem, isSolutionView: boolean): string {
    const payload: ViewRenderPayload<'operations-multiplication-standard-algorithm'> = {
        problem: {type: 'arithmetic', data, labels: []},
        viewId: 'operations-multiplication-standard-algorithm', targetLabels: [], isSolutionView, seed: 13
    };
    return renderToStaticMarkup(<OperationsMultiplicationStandardAlgorithmCore config={{}} payload={payload} />);
}

const visible = (markup: string): string => markup.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ');

describe('standard multiplication task projection', () => {
    it('shows factors, every row and place shift but withholds all computed digits and carries in Question', () => {
        const question = render(multiplicationCase(347, 206), false);
        expect(question).toContain('Multiply 347 × 206');
        expect(question).toContain('ones × 6');
        expect(question).toContain('tens × 0');
        expect(question).toContain('hundreds × 2');
        expect(question).toContain('Carry for ×6');
        expect(question).toContain('Sum carries');
        // The zero-multiplier row has one answer cell and one visible place-shift zero.
        expect(question.match(/Unresolved digit/g)).toHaveLength(13);
        expect(question.match(/Unresolved carry/g)).toHaveLength(4);
        expect(question).toContain('347 × 206 = ___');
        expect(question).not.toContain('71,482');
        expect(question).not.toContain('2,082');
        expect(question).not.toContain('69,400');
    });

    it('reveals zero row, shifted partials, multiplication carries and summed product in Solution', () => {
        const solution = render(multiplicationCase(347, 206), true);
        const text = visible(solution);
        expect(text).toContain('ones × 6');
        expect(text).toContain('tens × 0');
        expect(text).toContain('hundreds × 2');
        expect(text).toContain('2 0 8 2');
        expect(text).toContain('0 0');
        expect(text).toContain('6 9 4 0 0');
        expect(text).toContain('71,482');
        expect(solution).not.toContain('Unresolved digit');
        expect(solution).not.toContain('Unresolved carry');
        expect(solution.match(/border-t-\[3px\]/g)).toHaveLength(2);
    });

    it('rejects a corrupted carry chain before rendering the worksheet', () => {
        const data = multiplicationCase(347, 26);
        const partialRows = [...data.partialRows];
        partialRows[0] = {...partialRows[0]!, leadingCarry: 0};
        expect(() => render({...data, partialRows}, false)).toThrow('inconsistent');
    });

    it('renders the seven-digit product boundary in both modes', () => {
        const data = multiplicationCase(9999, 999);
        const question = render(data, false);
        const solution = render(data, true);
        expect(question).toContain('Multiply 9,999 × 999');
        expect(question).toContain('9,999 × 999 = ___');
        expect(question).not.toContain('9,989,001');
        expect(solution).toContain('9,999 × 999 = 9,989,001');
        expect(solution).not.toContain('Unresolved digit');
    });

    it('requires the full column method but withholds the failing 4288 × 855 calculation in Question', () => {
        const data = multiplicationCase(4288, 855);
        const question = render(data, false);
        expect(visible(question)).toContain('recording every digit multiplication and carry');
        expect(visible(question)).toContain('record each column sum');
        expect(question).not.toContain('3,666,240');
        expect(question).not.toContain('21,440');
        expect(question).not.toContain('column-calculations');
        const solution = visible(render(data, true));
        expect(solution).toContain('ones 0 + 0 + 0 = 0');
        // A positive multiplication yielding a zero digit is still the quantity 40.
        expect(solution).toContain('ones 8 × 5 = 40');
        expect(solution).not.toContain('8 × 5 = 0');
    });

    it('makes the zero addend in 88 × 94 visible without initialized or missing-place zeros', () => {
        const solution = render(multiplicationCase(88, 94), true);
        expect(solution).toContain('text-emerald-950');
        expect(visible(solution)).toContain('ones 2 + 0 = 2');
        expect(visible(solution)).toContain('thousands 7 + 1 = 8');
        expect(visible(solution)).not.toContain('0 + 7 + 1 = 8');
        expect(visible(solution)).not.toContain('8 × 4 + 0');
    });
});
