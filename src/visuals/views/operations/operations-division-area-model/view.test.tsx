import {renderToStaticMarkup} from 'react-dom/server';
import {afterAll, beforeAll, describe, expect, it, vi} from 'vitest';
import type {ViewRenderPayload} from '../../../../types/ml-engine.ts';
import type {
    DivisionOperandDecomposition,
    DivisionPartialQuotientStep,
    DivisionPlaceValuePart,
    MultiDigitDivisionProblem
} from '../../../../types/problems.ts';

let OperationsDivisionAreaModelCore: typeof import('./view.tsx').OperationsDivisionAreaModelCore;
beforeAll(async () => {
    vi.stubGlobal('window', {});
    OperationsDivisionAreaModelCore = (await import('./view.tsx')).OperationsDivisionAreaModelCore;
});
afterAll(() => vi.unstubAllGlobals());

function decompose(operand: number): DivisionOperandDecomposition {
    const digits = String(operand).split('').map(Number);
    const parts = digits.map((digit, index): DivisionPlaceValuePart => {
        const placeValue = (10 ** (digits.length - index - 1)) as DivisionPlaceValuePart['placeValue'];
        return {digit, placeValue, value: digit * placeValue};
    });
    return {operand, parts};
}

function problemFor(dividend: number, divisor: number): MultiDigitDivisionProblem {
    const quotient = Math.floor(dividend / divisor);
    const remainder = dividend % divisor;
    let remaining = dividend;
    const quotientDigits = String(quotient).split('').map(Number);
    const partialQuotients: DivisionPartialQuotientStep[] = quotientDigits.map((digit, index) => {
        const placeValue = (10 ** (quotientDigits.length - index - 1)) as DivisionPartialQuotientStep['placeValue'];
        const partialQuotient = digit * placeValue;
        const partialProduct = divisor * partialQuotient;
        const step = {
            quotientDigit: digit,
            placeValue,
            partialQuotient,
            remainingBefore: remaining,
            partialProduct,
            remainingAfter: remaining - partialProduct
        };
        remaining = step.remainingAfter;
        return step;
    });
    return {
        task: 'multi-digit-division',
        dividend,
        divisor,
        quotient,
        remainder,
        dividendDigits: String(dividend).length as MultiDigitDivisionProblem['dividendDigits'],
        divisorDigits: String(divisor).length as MultiDigitDivisionProblem['divisorDigits'],
        dividendDecomposition: decompose(dividend),
        divisorDecomposition: decompose(divisor),
        partialQuotients
    };
}

function render(data: MultiDigitDivisionProblem, isSolutionView: boolean): string {
    const payload: ViewRenderPayload<'operations-division-area-model'> = {
        problem: {type: 'arithmetic', data, labels: []},
        viewId: 'operations-division-area-model', targetLabels: [], isSolutionView, seed: 19
    };
    return renderToStaticMarkup(<OperationsDivisionAreaModelCore config={{}} payload={payload} />);
}

const visible = (markup: string): string => markup.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ');

describe('division partial-quotient task projection', () => {
    it('asks for an explanation and withholds the exact quotient and partial products', () => {
        const question = render(problemFor(1008, 12), false);
        const text = visible(question);
        expect(text).toContain('Divide 1,008 by 12');
        expect(text).toContain('1,008 = 1,000 + 0 + 0 + 8');
        expect(text).toContain('12 = 10 + 2');
        expect(text).toContain('Explain how the quotient chunks and amounts removed account for the dividend.');
        expect(question).toContain('Unresolved explanation');
        expect(text).not.toContain('12 × 80 = 960');
        expect(text).not.toContain('12 × 84 = 1,008');
        expect(text).not.toContain('exactly divisible');
    });

    it('explains the exact two-digit-divisor chain and displays no positive-remainder claim', () => {
        const text = visible(render(problemFor(1008, 12), true));
        expect(text).toContain('1,008 ÷ 12 = 84 (remainder 0)');
        expect(text).toContain('12 × 80 = 960');
        expect(text).toContain('1,008 − 960 = 48');
        expect(text).toContain('12 × 4 = 48');
        expect(text).toContain('48 − 48 = 0');
        expect(text).toContain('Nothing remains');
        expect(text).toContain('12 × 84 = 1,008');
        expect(text).not.toContain('Nonzero remainder');
    });

    it('retains the one-digit-divisor path and makes a zero quotient place explicit', () => {
        const text = visible(render(problemFor(811, 8), true));
        expect(text).toContain('811 ÷ 8 = 101 R 3');
        expect(text).toContain('Place-value division area model');
        expect(text).toContain('Equal regions show the ordered partial-quotient steps');
        expect(text).toContain('Nonzero remainder');
        expect(text).toContain('8 × 0 = 0');
        expect(text).toContain('11 − 0 = 11');
        expect(text).toContain('100 + 0 + 1 = 101');
        expect(text).toContain('8 × 101 + 3 = 811');
        expect(text).not.toContain('Why the steps work');

        const question = visible(render(problemFor(811, 8), false));
        expect(question).toContain('Choose each place-value quotient chunk, multiply, subtract, and record the amount left.');
        expect(question).not.toContain('Explain how the quotient chunks');
    });

    it('rejects a broken two-digit-divisor partial quotient before rendering', () => {
        const data = problemFor(1008, 12);
        const partialQuotients = [...data.partialQuotients];
        partialQuotients[0] = {...partialQuotients[0]!, partialProduct: 950};
        expect(() => render({...data, partialQuotients}, false)).toThrow('must agree');
    });
});
