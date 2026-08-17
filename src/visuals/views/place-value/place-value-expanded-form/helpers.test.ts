import {describe, expect, it} from 'vitest';
import {MultiDigitPlaceValueExpandedProblem} from '../../../../types/problems.ts';
import {
    displayPlaceName,
    isValidLegacyExpandedProblem,
    isValidMultiDigitExpandedProblem
} from './helpers.ts';

const grade4Problem: MultiDigitPlaceValueExpandedProblem = {
    task: 'multi-digit-expanded-form',
    number: 405032,
    terms: [400000, 5000, 30, 2],
    placeValues: [
        {name: 'hundred-thousands', exponent: 5, digit: 4, value: 400000},
        {name: 'ten-thousands', exponent: 4, digit: 0, value: 0},
        {name: 'thousands', exponent: 3, digit: 5, value: 5000},
        {name: 'hundreds', exponent: 2, digit: 0, value: 0},
        {name: 'tens', exponent: 1, digit: 3, value: 30},
        {name: 'ones', exponent: 0, digit: 2, value: 2}
    ],
    prompt: 'Write the numeral as a sum of its nonzero place values.',
    expandedEquation: '405,032 = 400,000 + 5,000 + 30 + 2'
};

describe('expanded-form validation', () => {
    it('preserves valid legacy three-digit decompositions', () => {
        expect(isValidLegacyExpandedProblem({number: 503, terms: [500, 3]})).toBe(true);
        expect(isValidLegacyExpandedProblem({number: 503, terms: [500, 30, 3]})).toBe(false);
    });

    it('accepts a complete Grade 4 place-value decomposition', () => {
        expect(isValidMultiDigitExpandedProblem(grade4Problem)).toBe(true);
    });

    it('rejects missing zero places, reordered terms, and inconsistent values', () => {
        expect(isValidMultiDigitExpandedProblem({
            ...grade4Problem,
            placeValues: grade4Problem.placeValues.filter(place => place.digit !== 0)
        })).toBe(false);
        expect(isValidMultiDigitExpandedProblem({
            ...grade4Problem,
            terms: [5000, 400000, 30, 2]
        })).toBe(false);
        expect(isValidMultiDigitExpandedProblem({
            ...grade4Problem,
            placeValues: grade4Problem.placeValues.map(place => (
                place.name === 'thousands' ? {...place, value: 500} : place
            ))
        })).toBe(false);
    });
});

describe('displayPlaceName', () => {
    it('formats compound place names for learners', () => {
        expect(displayPlaceName('hundred-thousands')).toBe('Hundred Thousands');
    });
});
