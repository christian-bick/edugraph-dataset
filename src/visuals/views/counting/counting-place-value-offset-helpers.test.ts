import {describe, expect, it} from 'vitest';
import {CountingIncDecProblem} from '../../../types/problems.ts';
import {
    analyzePlaceValueOffsetProblem,
    PlaceValueOffsetStep,
    PlaceValueOffsetViewId
} from './counting-place-value-offset-helpers.ts';

const viewId: PlaceValueOffsetViewId = 'counting-ten-more-less';

const problem = (
    numObjects: number,
    incDecAnswer: number,
    incDecType: CountingIncDecProblem['incDecType'],
    stepSize: PlaceValueOffsetStep = 10
): CountingIncDecProblem => {
    const useHundreds = stepSize === 100;
    const decompose = (value: number) => useHundreds
        ? {hundreds: Math.floor(value / 100), tens: Math.floor((value % 100) / 10), ones: value % 10}
        : {tens: Math.floor(value / 10), ones: value % 10};

    return {
        numObjects,
        incDecAnswer,
        incDecType,
        simpleAnswer: numObjects,
        stepSize,
        startPlaceValue: decompose(numObjects),
        resultPlaceValue: decompose(incDecAnswer)
    };
};

describe('counting place-value offset helpers', () => {
    it('analyzes ten more while preserving the ones digit', () => {
        expect(analyzePlaceValueOffsetProblem(problem(23, 33, 'inc'), 10, viewId)).toEqual({
            direction: 'inc',
            start: 23,
            result: 33,
            stepSize: 10,
            startParts: {tens: 2, ones: 3},
            resultParts: {tens: 3, ones: 3}
        });
    });

    it('analyzes ten less while preserving the ones digit', () => {
        expect(analyzePlaceValueOffsetProblem(problem(33, 23, 'dec'), 10, viewId)).toEqual({
            direction: 'dec',
            start: 33,
            result: 23,
            stepSize: 10,
            startParts: {tens: 3, ones: 3},
            resultParts: {tens: 2, ones: 3}
        });
    });

    it('handles regrouping at the ten-step upper and lower boundary', () => {
        expect(analyzePlaceValueOffsetProblem(problem(90, 100, 'inc'), 10, viewId).resultParts)
            .toEqual({tens: 10, ones: 0});
        expect(analyzePlaceValueOffsetProblem(problem(100, 90, 'dec'), 10, viewId).resultParts)
            .toEqual({tens: 9, ones: 0});
    });

    it('analyzes one hundred more while preserving both lower places', () => {
        expect(analyzePlaceValueOffsetProblem(
            problem(246, 346, 'inc', 100),
            100,
            'counting-hundred-more-less'
        )).toEqual({
            direction: 'inc',
            start: 246,
            result: 346,
            stepSize: 100,
            startParts: {hundreds: 2, tens: 4, ones: 6},
            resultParts: {hundreds: 3, tens: 4, ones: 6}
        });
    });

    it('rejects a payload whose step belongs to the sibling leaf', () => {
        expect(() => analyzePlaceValueOffsetProblem(problem(23, 33, 'inc'), 100, 'counting-hundred-more-less'))
            .toThrow();
        expect(() => analyzePlaceValueOffsetProblem(problem(246, 346, 'inc', 100), 10, viewId))
            .toThrow();
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
        expect(() => analyzePlaceValueOffsetProblem(invalidProblem, 10, viewId)).toThrow();
    });
});
