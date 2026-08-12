import {describe, expect, it} from 'vitest';
import {CountingIncDecProblem} from '../../../../types/problems.ts';
import {analyzeTenStepProblem, TenStepProblem} from './helpers.ts';

const problem = (
    numObjects: number,
    incDecAnswer: number,
    incDecType: CountingIncDecProblem['incDecType']
): TenStepProblem => ({
    numObjects,
    incDecAnswer,
    incDecType,
    simpleAnswer: numObjects,
    stepSize: 10,
    startPlaceValue: {
        tens: Math.floor(numObjects / 10),
        ones: numObjects % 10
    },
    resultPlaceValue: {
        tens: Math.floor(incDecAnswer / 10),
        ones: incDecAnswer % 10
    }
});

describe('counting-ten-more-less helpers', () => {
    it('analyzes ten more while preserving the ones digit', () => {
        expect(analyzeTenStepProblem(problem(23, 33, 'inc'))).toEqual({
            direction: 'inc',
            start: 23,
            result: 33,
            stepSize: 10,
            startParts: {tens: 2, ones: 3},
            resultParts: {tens: 3, ones: 3}
        });
    });

    it('analyzes ten less while preserving the ones digit', () => {
        expect(analyzeTenStepProblem(problem(33, 23, 'dec'))).toEqual({
            direction: 'dec',
            start: 33,
            result: 23,
            stepSize: 10,
            startParts: {tens: 3, ones: 3},
            resultParts: {tens: 2, ones: 3}
        });
    });

    it('handles the 90 to 100 regrouping boundary as 9 tens to 10 tens', () => {
        const analysis = analyzeTenStepProblem(problem(90, 100, 'inc'));
        expect(analysis.startParts).toEqual({tens: 9, ones: 0});
        expect(analysis.resultParts).toEqual({tens: 10, ones: 0});
    });

    it('handles the 100 to 90 boundary in the opposite direction', () => {
        const analysis = analyzeTenStepProblem(problem(100, 90, 'dec'));
        expect(analysis.startParts).toEqual({tens: 10, ones: 0});
        expect(analysis.resultParts).toEqual({tens: 9, ones: 0});
    });

    it('analyzes one hundred more while preserving lower places', () => {
        const data: TenStepProblem = {
            numObjects: 246,
            incDecAnswer: 346,
            incDecType: 'inc',
            simpleAnswer: 246,
            stepSize: 100,
            startPlaceValue: {hundreds: 2, tens: 4, ones: 6},
            resultPlaceValue: {hundreds: 3, tens: 4, ones: 6}
        };

        expect(analyzeTenStepProblem(data)).toEqual({
            direction: 'inc',
            start: 246,
            result: 346,
            stepSize: 100,
            startParts: {hundreds: 2, tens: 4, ones: 6},
            resultParts: {hundreds: 3, tens: 4, ones: 6}
        });
    });

    it.each([
        problem(23, 24, 'inc'),
        problem(23, 43, 'inc'),
        problem(23, 13, 'inc'),
        {...problem(23, 33, 'inc'), simpleAnswer: 33},
        {...problem(23, 33, 'inc'), stepSize: 1 as const},
        {...problem(23, 33, 'inc'), startPlaceValue: {tens: 1, ones: 3}},
        {...problem(23, 33, 'inc'), resultPlaceValue: {tens: 3, ones: 4}},
        problem(99, 109, 'inc')
    ])('rejects an unsupported transition: %o', invalidProblem => {
        expect(() => analyzeTenStepProblem(invalidProblem)).toThrow();
    });

});
