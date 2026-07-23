import { beforeEach, describe, expect, it } from 'vitest';
import { CountingIncDecGenerator } from './generator.ts';
import { setSeed } from '../../../lib/random.ts';
import { Area, Scope } from 'edugraph-ts';
import { generateWithLabels } from '../../../lib/utils.ts';

describe('CountingIncDecGenerator Spec Integration', () => {
    let generator: CountingIncDecGenerator;

    beforeEach(() => {
        generator = new CountingIncDecGenerator();
        setSeed(42);
    });

    it('should generate correct increment problems using labels', () => {
        const stub = generateWithLabels(generator, [
            Area.NumerationWithIntegers,
            Scope.NumbersWithoutZero,
            Scope.NumbersWithoutNegatives,
            Scope.NumbersSmaller10,
            Scope.AdditiveCount
        ]);
        expect(stub).not.toBeNull();
        expect(stub!.data.incDecType).toBe('inc');
        expect(stub!.data.incDecAnswer).toBe(stub!.data.numObjects + 1);
    });

    it('should generate correct decrement problems using labels', () => {
        const stub = generateWithLabels(generator, [
            Area.NumerationWithIntegers,
            Scope.NumbersWithoutZero,
            Scope.NumbersWithoutNegatives,
            Scope.NumbersSmaller10,
            Scope.SubtractiveCount
        ]);
        expect(stub).not.toBeNull();
        expect(stub!.data.incDecType).toBe('dec');
        expect(stub!.data.incDecAnswer).toBe(stub!.data.numObjects - 1);
    });

    it('should respect physical range bounds when using labels', () => {
        for (let i = 0; i < 50; i++) {
            setSeed(i);
            const stub = generateWithLabels(generator, [
                Area.NumerationWithIntegers,
                Scope.NumbersWithoutZero,
                Scope.NumbersWithoutNegatives,
                Scope.NumbersSmaller10,
                Scope.AdditiveCount
            ]);
            expect(stub).not.toBeNull();
            expect(stub!.data.numObjects).toBeGreaterThanOrEqual(1);
            expect(stub!.data.numObjects).toBeLessThanOrEqual(10);
        }
    });
});
