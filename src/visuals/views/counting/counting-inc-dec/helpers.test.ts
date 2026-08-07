import {describe, expect, it} from 'vitest';
import type {CountingIncDecProblem} from '../../../../types/problems.ts';
import {validateCountingIncDecProblem} from './helpers.ts';

const problem = (overrides: Partial<CountingIncDecProblem> = {}): CountingIncDecProblem => ({
    numObjects: 9,
    incDecType: 'inc',
    incDecAnswer: 10,
    simpleAnswer: 9,
    stepSize: 1,
    startPlaceValue: {tens: 0, ones: 9},
    resultPlaceValue: {tens: 1, ones: 0},
    ...overrides
});

describe('counting-inc-dec view helpers', () => {
    it.each([
        problem(),
        problem({
            numObjects: 10,
            incDecAnswer: 20,
            simpleAnswer: 10,
            stepSize: 10,
            startPlaceValue: {tens: 1, ones: 0},
            resultPlaceValue: {tens: 2, ones: 0}
        }),
        problem({
            numObjects: 20,
            incDecType: 'dec',
            incDecAnswer: 10,
            simpleAnswer: 20,
            stepSize: 10,
            startPlaceValue: {tens: 2, ones: 0},
            resultPlaceValue: {tens: 1, ones: 0}
        })
    ])('accepts a supported loose-object change: %o', data => {
        expect(() => validateCountingIncDecProblem(data)).not.toThrow();
    });

    it.each([
        problem({numObjects: 21, simpleAnswer: 21, startPlaceValue: {tens: 2, ones: 1}}),
        problem({incDecAnswer: 11, resultPlaceValue: {tens: 1, ones: 1}}),
        problem({incDecType: 'other' as never}),
        problem({simpleAnswer: 8}),
        problem({stepSize: 10}),
        problem({startPlaceValue: {tens: 9, ones: 9}}),
        problem({resultPlaceValue: {tens: 0, ones: 0}})
    ])('rejects inconsistent or overly dense data: %o', data => {
        expect(() => validateCountingIncDecProblem(data)).toThrow(/consistent ±1 or ±10/);
    });
});
