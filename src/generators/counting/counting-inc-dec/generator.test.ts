import {beforeEach, describe, expect, it} from 'vitest';
import {Scope} from 'edugraph-ts';
import {setSeed} from '../../../lib/random.ts';
import {CountingIncDecGenerator} from './generator.ts';

describe('CountingIncDecGenerator', () => {
    let generator: CountingIncDecGenerator;

    beforeEach(() => {
        generator = new CountingIncDecGenerator();
        setSeed(42);
    });

    it('has the counting problem type', () => {
        expect(generator.type).toBe('counting');
    });

    it('throws when required configuration is missing', () => {
        expect(() => generator.generate({})).toThrow();
    });

    it('increments by one without exceeding the range', () => {
        const stub = generator.generate({
            range: {min: 1, max: 10},
            direction: Scope.AdditiveCount,
            stepMagnitude: Scope.StepsOf1
        });

        expect(stub).not.toBeNull();
        expect(stub!.data.incDecType).toBe('inc');
        expect(stub!.data.incDecAnswer).toBe(stub!.data.numObjects + 1);
        expect(stub!.data.incDecAnswer).toBeLessThanOrEqual(10);
        expect(stub!.data.stepSize).toBe(1);
    });

    it('decrements by one without reaching zero', () => {
        const stub = generator.generate({
            range: {min: 1, max: 10},
            direction: Scope.SubtractiveCount,
            stepMagnitude: Scope.StepsOf1
        });

        expect(stub).not.toBeNull();
        expect(stub!.data.incDecType).toBe('dec');
        expect(stub!.data.incDecAnswer).toBe(stub!.data.numObjects - 1);
        expect(stub!.data.incDecAnswer).toBeGreaterThanOrEqual(1);
        expect(stub!.data.stepSize).toBe(1);
    });

    it('increments by ten while preserving the ones place', () => {
        const stub = generator.generate({
            range: {min: 10, max: 100},
            direction: Scope.AdditiveCount,
            stepMagnitude: Scope.StepsOf10
        });

        expect(stub).not.toBeNull();
        expect(stub!.data.incDecAnswer).toBe(stub!.data.numObjects + 10);
        expect(stub!.data.incDecAnswer).toBeLessThanOrEqual(100);
        expect(stub!.data.startPlaceValue.ones).toBe(stub!.data.resultPlaceValue.ones);
        expect(stub!.data.resultPlaceValue.tens).toBe(stub!.data.startPlaceValue.tens + 1);
    });

    it('decrements by ten while preserving the ones place', () => {
        const stub = generator.generate({
            range: {min: 10, max: 100},
            direction: Scope.SubtractiveCount,
            stepMagnitude: Scope.StepsOf10
        });

        expect(stub).not.toBeNull();
        expect(stub!.data.incDecAnswer).toBe(stub!.data.numObjects - 10);
        expect(stub!.data.incDecAnswer).toBeGreaterThanOrEqual(10);
        expect(stub!.data.startPlaceValue.ones).toBe(stub!.data.resultPlaceValue.ones);
        expect(stub!.data.resultPlaceValue.tens).toBe(stub!.data.startPlaceValue.tens - 1);
    });

    it('decomposes the start and result into matching base-ten values', () => {
        const stub = generator.generate({
            range: {min: 1, max: 100},
            direction: Scope.AdditiveCount,
            stepMagnitude: Scope.StepsOf10
        });

        expect(stub!.data.numObjects).toBe(
            stub!.data.startPlaceValue.tens * 10 + stub!.data.startPlaceValue.ones
        );
        expect(stub!.data.incDecAnswer).toBe(
            stub!.data.resultPlaceValue.tens * 10 + stub!.data.resultPlaceValue.ones
        );
    });

    it('increments by one hundred while preserving the tens and ones places', () => {
        const stub = generator.generate({
            range: {min: 101, max: 999},
            direction: Scope.AdditiveCount,
            stepMagnitude: Scope.StepsOf100
        });

        expect(stub).not.toBeNull();
        expect(stub!.data.incDecAnswer).toBe(stub!.data.numObjects + 100);
        expect(stub!.data.stepSize).toBe(100);
        expect(stub!.data.startPlaceValue.hundreds).toBeDefined();
        expect(stub!.data.resultPlaceValue.hundreds).toBe(stub!.data.startPlaceValue.hundreds! + 1);
        expect(stub!.data.resultPlaceValue.tens).toBe(stub!.data.startPlaceValue.tens);
        expect(stub!.data.resultPlaceValue.ones).toBe(stub!.data.startPlaceValue.ones);
    });

    it('uses digit-place decompositions for three-digit values', () => {
        const stub = generator.generate({
            range: {min: 101, max: 999},
            direction: Scope.SubtractiveCount,
            stepMagnitude: Scope.StepsOf10
        });

        const start = stub!.data.startPlaceValue;
        const result = stub!.data.resultPlaceValue;
        expect(stub!.data.numObjects).toBe(start.hundreds! * 100 + start.tens * 10 + start.ones);
        expect(stub!.data.incDecAnswer).toBe(result.hundreds! * 100 + result.tens * 10 + result.ones);
    });

    it('returns null when the range cannot fit the requested change', () => {
        expect(generator.generate({
            range: {min: 1, max: 1},
            direction: Scope.AdditiveCount,
            stepMagnitude: Scope.StepsOf1
        })).toBeNull();
        expect(generator.generate({
            range: {min: 1, max: 9},
            direction: Scope.AdditiveCount,
            stepMagnitude: Scope.StepsOf10
        })).toBeNull();
    });

    it('returns null for an unsupported direction', () => {
        expect(generator.generate({
            range: {min: 1, max: 20},
            direction: Scope.DerivedCount,
            stepMagnitude: Scope.StepsOf1
        } as never)).toBeNull();
    });

    it('returns null for an unsupported step magnitude', () => {
        expect(generator.generate({
            range: {min: 1, max: 20},
            direction: Scope.AdditiveCount,
            stepMagnitude: Scope.StepMagnitude
        } as never)).toBeNull();
    });
});
