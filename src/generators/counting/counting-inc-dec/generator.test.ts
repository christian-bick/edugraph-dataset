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
            direction: Scope.AdditiveCount
        });

        expect(stub).not.toBeNull();
        expect(stub!.data.incDecType).toBe('inc');
        expect(stub!.data.incDecAnswer).toBe(stub!.data.numObjects + 1);
        expect(stub!.data.incDecAnswer).toBeLessThanOrEqual(10);
    });

    it('decrements by one without reaching zero', () => {
        const stub = generator.generate({
            range: {min: 1, max: 10},
            direction: Scope.SubtractiveCount
        });

        expect(stub).not.toBeNull();
        expect(stub!.data.incDecType).toBe('dec');
        expect(stub!.data.incDecAnswer).toBe(stub!.data.numObjects - 1);
        expect(stub!.data.incDecAnswer).toBeGreaterThanOrEqual(1);
    });

    it('returns null when the range cannot fit the requested change', () => {
        expect(generator.generate({
            range: {min: 1, max: 1},
            direction: Scope.AdditiveCount
        })).toBeNull();
    });

    it('returns null for an unsupported direction', () => {
        expect(generator.generate({
            range: {min: 1, max: 20},
            direction: Scope.DerivedCount
        } as never)).toBeNull();
    });
});
