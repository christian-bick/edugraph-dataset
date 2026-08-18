import {describe, expect, it} from 'vitest';
import {StandardAlgorithmProblem} from '../../../../types/problems.ts';
import {isValidStandardAlgorithmProblem} from './helpers.ts';

const addition: StandardAlgorithmProblem = {
    task: 'standard-algorithm',
    operation: 'addition',
    topValue: 4567,
    bottomValue: 3789,
    result: 8356,
    columns: [
        {placeValue: 1, placeName: 'ones', topDigit: 7, bottomDigit: 9, regroupIn: 0, regroupOut: 1, workingValue: 16, resultDigit: 6, calculation: '7 + 9 = 16; write 6.', regroupingRecord: 'Carry 1 ten.'},
        {placeValue: 10, placeName: 'tens', topDigit: 6, bottomDigit: 8, regroupIn: 1, regroupOut: 1, workingValue: 15, resultDigit: 5, calculation: '1 + 6 + 8 = 15; write 5.', regroupingRecord: 'Carry 1 hundred.'},
        {placeValue: 100, placeName: 'hundreds', topDigit: 5, bottomDigit: 7, regroupIn: 1, regroupOut: 1, workingValue: 13, resultDigit: 3, calculation: '1 + 5 + 7 = 13; write 3.', regroupingRecord: 'Carry 1 thousand.'},
        {placeValue: 1000, placeName: 'thousands', topDigit: 4, bottomDigit: 3, regroupIn: 1, regroupOut: 0, workingValue: 8, resultDigit: 8, calculation: '1 + 4 + 3 = 8; write 8.', regroupingRecord: 'No carry.'}
    ],
    prompt: 'Add using the standard algorithm.',
    questionEquation: '4,567 + 3,789 = ?',
    solutionEquation: '4,567 + 3,789 = 8,356',
    explanation: 'Add from ones to thousands and record each carry.'
};

const subtraction: StandardAlgorithmProblem = {
    task: 'standard-algorithm',
    operation: 'subtraction',
    topValue: 5234,
    bottomValue: 1789,
    result: 3445,
    columns: [
        {placeValue: 1, placeName: 'ones', topDigit: 4, bottomDigit: 9, regroupIn: 0, regroupOut: 1, workingValue: 14, resultDigit: 5, calculation: '14 − 9 = 5.', regroupingRecord: 'Borrow 1 ten.'},
        {placeValue: 10, placeName: 'tens', topDigit: 3, bottomDigit: 8, regroupIn: 1, regroupOut: 1, workingValue: 12, resultDigit: 4, calculation: '12 − 8 = 4.', regroupingRecord: 'Borrow 1 hundred.'},
        {placeValue: 100, placeName: 'hundreds', topDigit: 2, bottomDigit: 7, regroupIn: 1, regroupOut: 1, workingValue: 11, resultDigit: 4, calculation: '11 − 7 = 4.', regroupingRecord: 'Borrow 1 thousand.'},
        {placeValue: 1000, placeName: 'thousands', topDigit: 5, bottomDigit: 1, regroupIn: 1, regroupOut: 0, workingValue: 4, resultDigit: 3, calculation: '4 − 1 = 3.', regroupingRecord: 'No borrow.'}
    ],
    prompt: 'Subtract using the standard algorithm.',
    questionEquation: '5,234 − 1,789 = ?',
    solutionEquation: '5,234 − 1,789 = 3,445',
    explanation: 'Subtract from ones to thousands and record each borrow.'
};

describe('isValidStandardAlgorithmProblem', () => {
    it('accepts consistent addition and subtraction column records', () => {
        expect(isValidStandardAlgorithmProblem(addition)).toBe(true);
        expect(isValidStandardAlgorithmProblem(subtraction)).toBe(true);
    });

    it('rejects columns that are not ordered from ones to the highest place', () => {
        const malformed = structuredClone(addition);
        malformed.columns = [
            malformed.columns[1]!,
            malformed.columns[0]!,
            ...malformed.columns.slice(2)
        ];
        expect(isValidStandardAlgorithmProblem(malformed)).toBe(false);
    });

    it('rejects inconsistent carry and borrow chains', () => {
        const malformedAddition = structuredClone(addition);
        malformedAddition.columns[1]!.regroupIn = 0;
        expect(isValidStandardAlgorithmProblem(malformedAddition)).toBe(false);

        const malformedSubtraction = structuredClone(subtraction);
        malformedSubtraction.columns[2]!.workingValue = 1;
        expect(isValidStandardAlgorithmProblem(malformedSubtraction)).toBe(false);
    });

    it('rejects an incorrect result or authored equation', () => {
        const incorrectResult = structuredClone(addition);
        incorrectResult.result = 8355;
        expect(isValidStandardAlgorithmProblem(incorrectResult)).toBe(false);

        const revealedQuestion = structuredClone(subtraction);
        revealedQuestion.questionEquation = revealedQuestion.solutionEquation;
        expect(isValidStandardAlgorithmProblem(revealedQuestion)).toBe(false);
    });

    it('rejects payloads outside the four-to-six-column layout capacity', () => {
        const tooShort = structuredClone(addition);
        tooShort.topValue = 567;
        tooShort.bottomValue = 189;
        tooShort.result = 756;
        tooShort.columns = tooShort.columns.slice(0, 3);
        expect(isValidStandardAlgorithmProblem(tooShort)).toBe(false);
    });
});
