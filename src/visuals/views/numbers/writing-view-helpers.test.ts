import {describe, expect, it} from 'vitest';
import type {MultiDigitWritingProblem} from '../../../types/problems.ts';
import {
    presentMultiDigitWriting,
    validateMultiDigitWritingProblem
} from './writing-view-helpers.tsx';

const placeValues = [
    {name: 'thousands', exponent: 3, digit: 4, value: 4000},
    {name: 'hundreds', exponent: 2, digit: 2, value: 200},
    {name: 'tens', exponent: 1, digit: 0, value: 0},
    {name: 'ones', exponent: 0, digit: 5, value: 5}
] as const;

const problem: MultiDigitWritingProblem = {
    number: 4205,
    placeValues: [...placeValues]
};

describe('multi-digit writing view validation', () => {
    it('accepts complete Grade 4 place-value evidence', () => {
        expect(() => validateMultiDigitWritingProblem('numbers-read-standard', problem))
            .not.toThrow();
    });

    it('derives both learner-facing notations from the neutral payload', () => {
        expect(presentMultiDigitWriting(problem)).toEqual({
            standardNumeral: '4,205',
            numberName: 'four thousand two hundred five'
        });
    });

    it('rejects inconsistent place-value evidence', () => {
        const invalid: MultiDigitWritingProblem = {
            ...problem,
            placeValues: problem.placeValues.map(place =>
                place.name === 'tens' ? {...place, value: 20} : place
            )
        };
        expect(() => validateMultiDigitWritingProblem(
            'numbers-write-standard',
            invalid
        )).toThrow(/internally consistent/);
    });
});
