import {renderToStaticMarkup} from 'react-dom/server';
import {afterAll, beforeAll, describe, expect, it, vi} from 'vitest';
import type {ViewRenderPayload} from '../../../types/ml-engine.ts';
import type {DecimalExpandedPlace, DecimalPlaceValueExpandedProblem} from '../../../types/problems.ts';
import {assertDecimalExpandedProblem, expandedTerm, expandedTermRows} from './decimal-expanded-helpers.ts';

const one: DecimalExpandedPlace = {
    name: 'ones', exponent: 0, digit: 5, unitNumerator: 1, unitDenominator: 1, contributionInThousandths: 5000
};
const zeroTenths: DecimalExpandedPlace = {
    name: 'tenths', exponent: -1, digit: 0, unitNumerator: 1, unitDenominator: 10, contributionInThousandths: 0
};
const zeroHundredths: DecimalExpandedPlace = {
    name: 'hundredths', exponent: -2, digit: 0, unitNumerator: 1, unitDenominator: 100, contributionInThousandths: 0
};
const eightThousandths: DecimalExpandedPlace = {
    name: 'thousandths', exponent: -3, digit: 8, unitNumerator: 1, unitDenominator: 1000, contributionInThousandths: 8
};
const placeholder: DecimalPlaceValueExpandedProblem = {
    kind: 'decimal-place-value-expanded', base: 10,
    wholePart: 5, fractionalDigits: [0, 0, 8], fractionalPrecision: 3,
    valueInThousandths: 5008, canonicalNumeral: '5.008',
    places: [one, zeroTenths, zeroHundredths, eightThousandths],
    sumTerms: [one, eightThousandths]
};

const threeTenths: DecimalExpandedPlace = {
    name: 'tenths', exponent: -1, digit: 3, unitNumerator: 1, unitDenominator: 10, contributionInThousandths: 300
};
const fiveThousandths: DecimalExpandedPlace = {
    name: 'thousandths', exponent: -3, digit: 5, unitNumerator: 1, unitDenominator: 1000, contributionInThousandths: 5
};
const twoOnes: DecimalExpandedPlace = {...one, digit: 2, contributionInThousandths: 2000};
const middleZero: DecimalPlaceValueExpandedProblem = {
    ...placeholder,
    wholePart: 2, fractionalDigits: [3, 0, 5],
    valueInThousandths: 2305, canonicalNumeral: '2.305',
    places: [twoOnes, threeTenths, zeroHundredths, fiveThousandths],
    sumTerms: [twoOnes, threeTenths, fiveThousandths]
};

let Core: typeof import('./numbers-decimal-expanded-form/view.tsx').NumbersDecimalExpandedFormCore;
beforeAll(async () => {
    vi.stubGlobal('window', {});
    Core = (await import('./numbers-decimal-expanded-form/view.tsx')).NumbersDecimalExpandedFormCore;
});
afterAll(() => vi.unstubAllGlobals());

function render(data: DecimalPlaceValueExpandedProblem, isSolutionView: boolean): string {
    const payload: ViewRenderPayload<'numbers-decimal-expanded-form'> = {
        problem: {type: 'arithmetic', data, labels: []},
        viewId: 'numbers-decimal-expanded-form', targetLabels: [], isSolutionView, seed: 3
    };
    return renderToStaticMarkup(<Core payload={payload} />).replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ');
}

describe('decimal expanded-form view', () => {
    it('keeps zero placeholders visible while withholding the expanded terms in Question Mode', () => {
        const question = render(placeholder, false);
        expect(question).toContain('5.008');
        expect(question).toContain('tenths');
        expect(question).toContain('hundredths');
        expect(question).toContain('thousandths');
        expect(question).not.toContain('5 × 1');
        expect(question).not.toContain('8 × 1/1000');
    });

    it('reveals only the ordered nonzero terms with exact fractional units', () => {
        expect(() => assertDecimalExpandedProblem('test', placeholder)).not.toThrow();
        expect(expandedTerm(eightThousandths)).toBe('8 × 1/1000');
        const solution = render(placeholder, true);
        expect(solution).toContain('5 × 1');
        expect(solution).toContain('8 × 1/1000');
        expect(solution).not.toContain('0 ×');
    });

    it('supports a middle zero without inserting a zero term into the sum', () => {
        expect(() => assertDecimalExpandedProblem('test', middleZero)).not.toThrow();
        const solution = render(middleZero, true);
        expect(solution).toContain('2 × 1');
        expect(solution).toContain('3 × 1/10');
        expect(solution).toContain('5 × 1/1000');
        expect(solution).not.toContain('0 × 1/100');
    });

    it('rejects a missing nonzero term or an incorrect contribution', () => {
        expect(() => assertDecimalExpandedProblem('test', {...placeholder, sumTerms: [one]})).toThrow('at least two');
        expect(() => assertDecimalExpandedProblem('test', {
            ...placeholder,
            places: [one, zeroTenths, zeroHundredths, {...eightThousandths, contributionInThousandths: 80}]
        })).toThrow('contributions');
    });

    it('balances five and six terms across two rows instead of leaving a final term alone', () => {
        const sixTerms = Array.from({length: 6}, (_, index) => ({...one, exponent: 2 - index}));
        expect(expandedTermRows(sixTerms).map(row => row.length)).toEqual([3, 3]);
        expect(expandedTermRows(sixTerms.slice(0, 5)).map(row => row.length)).toEqual([3, 2]);
        expect(expandedTermRows(sixTerms.slice(0, 3)).map(row => row.length)).toEqual([3]);
    });
});
