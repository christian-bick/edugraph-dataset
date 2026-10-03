import {renderToStaticMarkup} from 'react-dom/server';
import {afterAll, beforeAll, describe, expect, it, vi} from 'vitest';
import type {ViewRenderPayload} from '../../../types/ml-engine.ts';
import type {DecimalAddSubtractProblem} from '../../../types/problems.ts';
import {assertDecimalAddSubtract} from './decimal-add-subtract-method-helpers.ts';

const addition: DecimalAddSubtractProblem = {
    kind: 'decimal-add-subtract', base: 10, scale: 100, operation: 'addition',
    first: {valueInHundredths: 168, canonicalNumeral: '1.68', alignedDigits: [1, 6, 8]},
    second: {valueInHundredths: 247, canonicalNumeral: '2.47', alignedDigits: [2, 4, 7]},
    result: {valueInHundredths: 415, canonicalNumeral: '4.15', alignedDigits: [4, 1, 5]},
    columns: [
        {place: 'hundredths', firstDigit: 8, secondDigit: 7, regroupIn: 0, regroupOut: 1, workingUnits: 15, resultDigit: 5},
        {place: 'tenths', firstDigit: 6, secondDigit: 4, regroupIn: 1, regroupOut: 1, workingUnits: 11, resultDigit: 1},
        {place: 'ones', firstDigit: 1, secondDigit: 2, regroupIn: 1, regroupOut: 0, workingUnits: 4, resultDigit: 4}
    ],
    model: {
        initial: {ones: 1, tenths: 6, hundredths: 8},
        steps: [
            {kind: 'join-second', before: {ones: 1, tenths: 6, hundredths: 8}, after: {ones: 3, tenths: 10, hundredths: 15}},
            {kind: 'compose-ten', lowerPlace: 'hundredths', before: {ones: 3, tenths: 10, hundredths: 15}, after: {ones: 3, tenths: 11, hundredths: 5}},
            {kind: 'compose-ten', lowerPlace: 'tenths', before: {ones: 3, tenths: 11, hundredths: 5}, after: {ones: 4, tenths: 1, hundredths: 5}}
        ],
        final: {ones: 4, tenths: 1, hundredths: 5}
    }
};

const subtraction: DecimalAddSubtractProblem = {
    kind: 'decimal-add-subtract', base: 10, scale: 100, operation: 'subtraction',
    first: {valueInHundredths: 102, canonicalNumeral: '1.02', alignedDigits: [1, 0, 2]},
    second: {valueInHundredths: 38, canonicalNumeral: '0.38', alignedDigits: [0, 3, 8]},
    result: {valueInHundredths: 64, canonicalNumeral: '0.64', alignedDigits: [0, 6, 4]},
    columns: [
        {place: 'hundredths', firstDigit: 2, secondDigit: 8, regroupIn: 0, regroupOut: 1, workingUnits: 12, resultDigit: 4},
        {place: 'tenths', firstDigit: 0, secondDigit: 3, regroupIn: 1, regroupOut: 1, workingUnits: 9, resultDigit: 6},
        {place: 'ones', firstDigit: 1, secondDigit: 0, regroupIn: 1, regroupOut: 0, workingUnits: 0, resultDigit: 0}
    ],
    model: {
        initial: {ones: 1, tenths: 0, hundredths: 2},
        steps: [
            {kind: 'decompose-one', lowerPlace: 'tenths', before: {ones: 1, tenths: 0, hundredths: 2}, after: {ones: 0, tenths: 10, hundredths: 2}},
            {kind: 'decompose-one', lowerPlace: 'hundredths', before: {ones: 0, tenths: 10, hundredths: 2}, after: {ones: 0, tenths: 9, hundredths: 12}},
            {kind: 'remove-second', before: {ones: 0, tenths: 9, hundredths: 12}, after: {ones: 0, tenths: 6, hundredths: 4}}
        ],
        final: {ones: 0, tenths: 6, hundredths: 4}
    }
};

let Core: typeof import('./operations-decimal-addition-subtraction-method/view.tsx').OperationsDecimalAdditionSubtractionMethodCore;
beforeAll(async () => {
    vi.stubGlobal('window', {});
    Core = (await import('./operations-decimal-addition-subtraction-method/view.tsx')).OperationsDecimalAdditionSubtractionMethodCore;
});
afterAll(() => vi.unstubAllGlobals());

function render(data: DecimalAddSubtractProblem, isSolutionView: boolean): string {
    const payload: ViewRenderPayload<'operations-decimal-addition-subtraction-method'> = {
        problem: {type: 'arithmetic', data, labels: []},
        viewId: 'operations-decimal-addition-subtraction-method', targetLabels: [], isSolutionView, seed: 4
    };
    return renderToStaticMarkup(<Core payload={payload} />);
}

function visible(markup: string): string {
    return markup.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ');
}

describe('decimal addition and subtraction method view', () => {
    it('shows given pieces but withholds answer, exchange drawings, and strategy in Question Mode', () => {
        expect(() => assertDecimalAddSubtract('test', addition)).not.toThrow();
        const question = render(addition, false);
        expect(question).toContain('one whole square');
        expect(question).toContain('one tenth rod');
        expect(question).toContain('one hundredth piece');
        expect(visible(question)).not.toContain('4.15');
        expect(visible(question)).not.toContain('Exchange 1');
        expect(visible(question)).not.toContain('carry 1');
        expect(visible(question)).toContain('1 . 6 8 + 2 . 4 7');
        expect(question).toContain('border-dashed');
    });

    it('shows both countable addition exchanges and completed aligned work', () => {
        const solution = render(addition, true);
        const text = visible(solution);
        expect(text).toContain('1.68 + 2.47 = 4.15');
        expect(text).toContain('Exchange 1');
        expect(text).toContain('Exchange 2');
        expect(text).toContain('Joined pieces before exchanges');
        expect(text).toContain('1 . 6 8 + 2 . 4 7 = 4 . 1 5');
        expect(text).toContain('+1 marks a carry into that place');
        expect(text).toContain('10 hundredths');
        expect(text).toContain('10 tenths');
        expect(text).toContain('4 ones, 1 tenth, and 5 hundredths');
        expect((solution.match(/aria-label="one hundredth piece"/g) ?? []).length).toBeGreaterThan(20);
    });

    it('shows two actual borrow exchanges through a zero placeholder', () => {
        expect(() => assertDecimalAddSubtract('test', subtraction)).not.toThrow();
        const question = visible(render(subtraction, false));
        expect(question).not.toContain('0.64');
        const solution = visible(render(subtraction, true));
        expect(solution).toContain('1.02 − 0.38 = 0.64');
        expect(solution).toContain('Exchange 1 whole for 10 tenths');
        expect(solution).toContain('Exchange 1 tenth for 10 hundredths');
        expect(solution).toContain('Remove these second-operand pieces');
        expect(solution).toContain('Exchanged pieces − second-operand pieces');
        expect(solution).toContain('−1 marks a unit borrowed from that place');
        expect(solution).toContain('0 ones, 6 tenths, and 4 hundredths');
    });

    it('rejects an incorrect written carry and a disconnected model step', () => {
        expect(() => assertDecimalAddSubtract('test', {
            ...addition,
            columns: [{...addition.columns[0], regroupOut: 0}, addition.columns[1], addition.columns[2]]
        })).toThrow('written place-value steps');
        expect(() => assertDecimalAddSubtract('test', {
            ...subtraction,
            model: {
                ...subtraction.model,
                steps: [subtraction.model.steps[0], {
                    ...subtraction.model.steps[1],
                    after: {ones: 0, tenths: 8, hundredths: 12}
                }, subtraction.model.steps[2]]
            }
        })).toThrow('invalid or disconnected unit exchange');
    });
});
