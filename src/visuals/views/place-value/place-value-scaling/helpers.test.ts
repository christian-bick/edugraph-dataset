import {describe, expect, it} from 'vitest';
import {PlaceValueScalingProblem} from '../../../../types/problems.ts';
import {
    displayPlaceName,
    isValidPlaceValueScalingProblem,
    placeValueScalingPresentation
} from './helpers.ts';

const validProblem: PlaceValueScalingProblem = {
    task: 'adjacent-place-scaling',
    number: 366421,
    digits: [3, 6, 6, 4, 2, 1],
    repeatedDigit: 6,
    leftPlace: {name: 'ten-thousands', exponent: 4, digitIndex: 1, value: 60000},
    rightPlace: {name: 'thousands', exponent: 3, digitIndex: 2, value: 6000},
    scaleFactor: 10
};

describe('isValidPlaceValueScalingProblem', () => {
    it('accepts a coherent adjacent-place scaling contract', () => {
        expect(isValidPlaceValueScalingProblem(validProblem)).toBe(true);
    });

    it('rejects non-adjacent, misvalued, or duplicated comparison digits', () => {
        expect(isValidPlaceValueScalingProblem({
            ...validProblem,
            rightPlace: {...validProblem.rightPlace, digitIndex: 3}
        })).toBe(false);
        expect(isValidPlaceValueScalingProblem({
            ...validProblem,
            leftPlace: {...validProblem.leftPlace, value: 6000}
        })).toBe(false);
        expect(isValidPlaceValueScalingProblem({
            ...validProblem,
            number: 366426,
            digits: [3, 6, 6, 4, 2, 6]
        })).toBe(false);
    });

    it('derives question and solution language from the canonical relationship', () => {
        expect(placeValueScalingPresentation(validProblem)).toEqual({
            prompt: 'The 6 in the thousands place represents 6000. What value does the same digit represent in the adjacent ten thousands place?',
            questionMultiplicationEquation: '6000 × 10 = ?',
            questionDivisionEquation: '? ÷ 10 = 6000',
            multiplicationEquation: '6000 × 10 = 60000',
            divisionEquation: '60000 ÷ 10 = 6000',
            comparisonStatement: 'The 6 in the ten thousands place represents 10 times as much as the 6 in the thousands place.'
        });
    });
});

describe('displayPlaceName', () => {
    it('renders compound place names with visible word spacing', () => {
        expect(displayPlaceName('hundred-thousands')).toBe('Hundred Thousands');
        expect(displayPlaceName('ones')).toBe('Ones');
    });
});
