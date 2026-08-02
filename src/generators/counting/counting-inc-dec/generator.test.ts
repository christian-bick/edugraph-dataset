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
            isIncrement: true,
            isDecrement: false,
            countMode: Scope.AdditiveCount
        });

        expect(stub).not.toBeNull();
        expect(stub!.data.incDecType).toBe('inc');
        expect(stub!.data.stepSize).toBe(1);
        expect(stub!.data.incDecAnswer).toBe(stub!.data.numObjects + 1);
        expect(stub!.data.incDecAnswer).toBeLessThanOrEqual(10);
    });

    it('decrements by one without reaching zero', () => {
        const stub = generator.generate({
            range: {min: 1, max: 10},
            isIncrement: false,
            isDecrement: true,
            countMode: Scope.SubtractiveCount
        });

        expect(stub).not.toBeNull();
        expect(stub!.data.incDecType).toBe('dec');
        expect(stub!.data.stepSize).toBe(1);
        expect(stub!.data.incDecAnswer).toBe(stub!.data.numObjects - 1);
        expect(stub!.data.incDecAnswer).toBeGreaterThanOrEqual(1);
    });

    it.each([true, false])('changes by ten for derived counting (increment: %s)', isIncrement => {
        const stub = generator.generate({
            range: {min: 1, max: 100},
            isIncrement,
            isDecrement: !isIncrement,
            countMode: Scope.DerivedCount
        });

        expect(stub).not.toBeNull();
        expect(stub!.data.stepSize).toBe(10);
        expect(Math.abs(stub!.data.incDecAnswer - stub!.data.numObjects)).toBe(10);
        expect(stub!.data.incDecAnswer).toBeGreaterThanOrEqual(1);
        expect(stub!.data.incDecAnswer).toBeLessThanOrEqual(100);
    });

    it('returns null when the requested step cannot fit the range', () => {
        expect(generator.generate({
            range: {min: 1, max: 10},
            isIncrement: true,
            isDecrement: false,
            countMode: Scope.DerivedCount
        })).toBeNull();
    });

    it('returns null without one explicit direction', () => {
        expect(generator.generate({
            range: {min: 1, max: 100},
            isIncrement: false,
            isDecrement: false,
            countMode: Scope.DerivedCount
        })).toBeNull();
    });
});
