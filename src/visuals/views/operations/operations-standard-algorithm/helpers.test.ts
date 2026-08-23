import {describe, expect, it} from 'vitest';
import {StandardAlgorithmProblem} from '../../../../types/problems.ts';
import {
    isValidStandardAlgorithmProblem,
    standardAlgorithmPresentation
} from './helpers.ts';

const addition: StandardAlgorithmProblem = {
    task: 'standard-algorithm',
    operation: 'addition',
    topValue: 4567,
    bottomValue: 3789,
    result: 8356,
    columns: [
        {placeValue: 1, topDigit: 7, bottomDigit: 9, regroupIn: 0, regroupOut: 1, workingValue: 16, resultDigit: 6},
        {placeValue: 10, topDigit: 6, bottomDigit: 8, regroupIn: 1, regroupOut: 1, workingValue: 15, resultDigit: 5},
        {placeValue: 100, topDigit: 5, bottomDigit: 7, regroupIn: 1, regroupOut: 1, workingValue: 13, resultDigit: 3},
        {placeValue: 1000, topDigit: 4, bottomDigit: 3, regroupIn: 1, regroupOut: 0, workingValue: 8, resultDigit: 8}
    ]
};

const subtraction: StandardAlgorithmProblem = {
    task: 'standard-algorithm',
    operation: 'subtraction',
    topValue: 5234,
    bottomValue: 1789,
    result: 3445,
    columns: [
        {placeValue: 1, topDigit: 4, bottomDigit: 9, regroupIn: 0, regroupOut: 1, workingValue: 14, resultDigit: 5},
        {placeValue: 10, topDigit: 3, bottomDigit: 8, regroupIn: 1, regroupOut: 1, workingValue: 12, resultDigit: 4},
        {placeValue: 100, topDigit: 2, bottomDigit: 7, regroupIn: 1, regroupOut: 1, workingValue: 11, resultDigit: 4},
        {placeValue: 1000, topDigit: 5, bottomDigit: 1, regroupIn: 1, regroupOut: 0, workingValue: 4, resultDigit: 3}
    ]
};

describe('isValidStandardAlgorithmProblem', () => {
    it('accepts consistent addition and subtraction column records', () => {
        expect(isValidStandardAlgorithmProblem(addition)).toBe(true);
        expect(isValidStandardAlgorithmProblem(subtraction)).toBe(true);
    });

    it('derives all standard-algorithm presentation from the numeric witness', () => {
        const presentation = standardAlgorithmPresentation(addition);
        expect(presentation).toMatchObject({
            prompt: 'Use the standard addition algorithm to solve 4,567 + 3,789 = ?',
            questionEquation: '4,567 + 3,789 = ?',
            solutionEquation: '4,567 + 3,789 = 8,356',
            explanation: 'Work from ones to the highest place, recording every carry or borrow. The completed algorithm gives 4,567 + 3,789 = 8,356.'
        });
        expect(presentation.columns[0]).toMatchObject({
            placeName: 'ones',
            calculation: '7 + 9 = 16',
            regroupingRecord: 'Write 6 in the ones place and carry 1 to the tens place.'
        });
        expect(presentation.columns[3]).toMatchObject({
            placeName: 'thousands',
            calculation: '4 + 3 + 1 = 8',
            regroupingRecord: 'Include the carried 1, write 8 in the thousands place, and record no new carry.'
        });
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

    it('rejects an incorrect result', () => {
        const incorrectResult = structuredClone(addition);
        incorrectResult.result = 8355;
        expect(isValidStandardAlgorithmProblem(incorrectResult)).toBe(false);
    });

    it('accepts three columns and rejects payloads outside the three-to-six-column layout capacity', () => {
        const threeColumn: StandardAlgorithmProblem = {
            ...structuredClone(addition),
            topValue: 567,
            bottomValue: 189,
            result: 756,
            columns: [
                {placeValue: 1, topDigit: 7, bottomDigit: 9, regroupIn: 0, regroupOut: 1, workingValue: 16, resultDigit: 6},
                {placeValue: 10, topDigit: 6, bottomDigit: 8, regroupIn: 1, regroupOut: 1, workingValue: 15, resultDigit: 5},
                {placeValue: 100, topDigit: 5, bottomDigit: 1, regroupIn: 1, regroupOut: 0, workingValue: 7, resultDigit: 7}
            ]
        };
        expect(isValidStandardAlgorithmProblem(threeColumn)).toBe(true);

        threeColumn.columns = threeColumn.columns.slice(0, 2);
        expect(isValidStandardAlgorithmProblem(threeColumn)).toBe(false);
    });
});
