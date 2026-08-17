import {describe, expect, it} from 'vitest';
import {MultiDigitComparisonProblem} from '../../../../types/problems.ts';
import {
    displayPlaceHeading,
    getComparisonSymbol,
    isValidLegacyComparisonProblem,
    isValidMultiDigitComparisonProblem
} from './helpers.ts';

describe('numbers-compare helpers', () => {
    it('maps greater to greater-than symbol', () => {
        expect(getComparisonSymbol('greater')).toBe('>');
    });

    it('maps A to greater-than symbol', () => {
        expect(getComparisonSymbol('A')).toBe('>');
    });

    it('maps less to less-than symbol', () => {
        expect(getComparisonSymbol('less')).toBe('<');
    });

    it('maps B to less-than symbol', () => {
        expect(getComparisonSymbol('B')).toBe('<');
    });

    it('maps equal to equals symbol', () => {
        expect(getComparisonSymbol('equal')).toBe('=');
    });

    it('returns raw symbol if already mapped', () => {
        expect(getComparisonSymbol('<')).toBe('<');
    });
});

const firstDifferenceProblem: MultiDigitComparisonProblem = {
    task: 'multi-digit-place-value-comparison',
    num1: 705284,
    num2: 704999,
    relation: 'greater',
    leftNumeral: '705,284',
    rightNumeral: '704,999',
    symbol: '>',
    prompt: 'Compare the two multi-digit whole numbers using <, >, or =.',
    comparisonEquation: '705,284 > 704,999',
    conclusion: '705,284 is greater than 704,999.',
    evidence: {
        kind: 'first-difference',
        placeName: 'thousands',
        exponent: 3,
        leftDigit: 5,
        rightDigit: 4,
        leftPlaceValue: 5000,
        rightPlaceValue: 4000,
        explanation: 'The first differing place is the thousands place: 5 is greater than 4.'
    }
};

describe('comparison validation', () => {
    it('validates legacy relations without imposing Grade 4 ranges', () => {
        expect(isValidLegacyComparisonProblem({num1: -2, num2: 0, relation: 'less'})).toBe(true);
        expect(isValidLegacyComparisonProblem({num1: 8, num2: 3, relation: 'less'})).toBe(false);
    });

    it('accepts supplied first-difference evidence', () => {
        expect(isValidMultiDigitComparisonProblem(firstDifferenceProblem)).toBe(true);
    });

    it('accepts supplied all-equal evidence', () => {
        expect(isValidMultiDigitComparisonProblem({
            ...firstDifferenceProblem,
            num2: 705284,
            relation: 'equal',
            rightNumeral: '705,284',
            symbol: '=',
            comparisonEquation: '705,284 = 705,284',
            conclusion: '705,284 is equal to 705,284.',
            evidence: {
                kind: 'all-equal',
                explanation: 'Every corresponding place has the same digit, so the numbers are equal.'
            }
        })).toBe(true);
    });

    it('rejects evidence that does not identify the first differing place', () => {
        expect(isValidMultiDigitComparisonProblem({
            ...firstDifferenceProblem,
            evidence: {
                kind: 'first-difference',
                placeName: 'hundreds',
                exponent: 2,
                leftDigit: 5,
                rightDigit: 4,
                leftPlaceValue: 500,
                rightPlaceValue: 400,
                explanation: 'The first differing place is the hundreds place: 5 is greater than 4.'
            }
        })).toBe(false);
        expect(isValidMultiDigitComparisonProblem({
            ...firstDifferenceProblem,
            comparisonEquation: '705,284 < 704,999'
        })).toBe(false);
    });
});

describe('displayPlaceHeading', () => {
    it('formats compound place names for evidence headings', () => {
        expect(displayPlaceHeading('ten-thousands')).toBe('Ten Thousands');
    });
});
