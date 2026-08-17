import {describe, expect, it} from 'vitest';
import {PlaceValueScalingProblem} from '../../../../types/problems.ts';
import {displayPlaceName, isValidPlaceValueScalingProblem} from './helpers.ts';

const validProblem: PlaceValueScalingProblem = {
    task: 'adjacent-place-scaling',
    number: 366421,
    digits: [3, 6, 6, 4, 2, 1],
    repeatedDigit: 6,
    leftPlace: {name: 'ten-thousands', exponent: 4, digitIndex: 1, value: 60000},
    rightPlace: {name: 'thousands', exponent: 3, digitIndex: 2, value: 6000},
    scaleFactor: 10,
    prompt: 'What value does the 6 in the ten thousands place represent?',
    questionMultiplicationEquation: '6000 × 10 = ?',
    questionDivisionEquation: '? ÷ 10 = 6000',
    multiplicationEquation: '6000 × 10 = 60000',
    divisionEquation: '60000 ÷ 10 = 6000',
    comparisonStatement: '60,000 is 10 times as great as 6,000.',
    answer: 60000
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

    it('rejects equations that do not reproduce the supplied relationship', () => {
        expect(isValidPlaceValueScalingProblem({
            ...validProblem,
            questionMultiplicationEquation: '6000 × ? = 60000'
        })).toBe(false);
        expect(isValidPlaceValueScalingProblem({
            ...validProblem,
            questionDivisionEquation: '60000 ÷ ? = 6000'
        })).toBe(false);
        expect(isValidPlaceValueScalingProblem({
            ...validProblem,
            multiplicationEquation: '60000 × 10 = 6000'
        })).toBe(false);
        expect(isValidPlaceValueScalingProblem({...validProblem, answer: 10})).toBe(false);
    });
});

describe('displayPlaceName', () => {
    it('renders compound place names with visible word spacing', () => {
        expect(displayPlaceName('hundred-thousands')).toBe('Hundred Thousands');
        expect(displayPlaceName('ones')).toBe('Ones');
    });
});
