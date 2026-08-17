import {describe, expect, it} from 'vitest';
import type {
    MultiDigitBaseTenNumeralProblem,
    MultiDigitNumberNameProblem
} from '../../../types/problems.ts';
import {validateMultiDigitWritingProblem} from './writing-view-helpers.tsx';

const placeValues = [
    {name: 'thousands', exponent: 3, digit: 4, value: 4000},
    {name: 'hundreds', exponent: 2, digit: 2, value: 200},
    {name: 'tens', exponent: 1, digit: 0, value: 0},
    {name: 'ones', exponent: 0, digit: 5, value: 5}
] as const;

const baseTenProblem: MultiDigitBaseTenNumeralProblem = {
    task: 'multi-digit-base-ten-numeral',
    number: 4205,
    standardNumeral: '4,205',
    numberName: 'four thousand two hundred five',
    placeValues: [...placeValues],
    readPrompt: 'Read the numeral.',
    writePrompt: 'Write the numeral.'
};

const numberNameProblem: MultiDigitNumberNameProblem = {
    task: 'multi-digit-number-name',
    number: 4205,
    standardNumeral: '4,205',
    numberName: 'four thousand two hundred five',
    placeValues: [...placeValues],
    prompt: 'Write the number name.'
};

describe('multi-digit writing view validation', () => {
    it('accepts both complete Grade 4 writing variants', () => {
        expect(() => validateMultiDigitWritingProblem(
            'numbers-read-standard',
            baseTenProblem,
            'multi-digit-base-ten-numeral'
        )).not.toThrow();
        expect(() => validateMultiDigitWritingProblem(
            'numbers-write-name',
            numberNameProblem,
            'multi-digit-number-name'
        )).not.toThrow();
    });

    it('rejects the wrong task family', () => {
        expect(() => validateMultiDigitWritingProblem(
            'numbers-read-standard',
            numberNameProblem,
            'multi-digit-base-ten-numeral'
        )).toThrow(/Expected task/);
    });

    it('rejects inconsistent place-value evidence', () => {
        const invalid: MultiDigitBaseTenNumeralProblem = {
            ...baseTenProblem,
            placeValues: baseTenProblem.placeValues.map(place =>
                place.name === 'tens' ? {...place, value: 20} : place
            )
        };
        expect(() => validateMultiDigitWritingProblem(
            'numbers-write-standard',
            invalid,
            'multi-digit-base-ten-numeral'
        )).toThrow(/internally consistent/);
    });
});
