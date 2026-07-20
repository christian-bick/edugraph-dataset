import {beforeEach, describe, expect, it} from 'vitest';
import {OrderingGenerator} from './generator.ts';
import {setSeed} from '../../lib/random.ts';
import {Area, Scope} from 'edugraph-ts';
import {generateWithLabels} from '../../lib/utils.ts';

describe('OrderingGenerator Spec Integration', () => {
    let generator: OrderingGenerator;

    beforeEach(() => {
        generator = new OrderingGenerator();
        setSeed(42);
    });

    it('should generate ordering problems with zero and negatives when requested', () => {
        for (let i = 0; i < 20; i++) {
            const stub = generateWithLabels(generator, [
                Area.NumericOrder,
                Scope.NumbersWithZero,
                Scope.NumbersWithNegatives,
                Scope.NumbersSmaller100
            ]);
            expect(stub).not.toBeNull();
            expect(stub!.data.numbers.length).toBe(5);
            expect(stub!.data.numbers).toContain(0);
            
            // Check that we have at least some negative numbers
            const negatives = stub!.data.numbers.filter((n: number) => n < 0);
            expect(stub!.data.numbers.every((n: number) => Math.abs(n) <= 100)).toBe(true);
        }
    });

    it('should generate ordering problems without zero and without negatives when requested', () => {
        for (let i = 0; i < 20; i++) {
            const stub = generateWithLabels(generator, [
                Area.NumericOrder,
                Scope.NumbersWithoutZero,
                Scope.NumbersWithoutNegatives,
                Scope.NumbersSmaller100
            ]);
            expect(stub).not.toBeNull();
            expect(stub!.data.numbers.length).toBe(5);
            expect(stub!.data.numbers).not.toContain(0);
            stub!.data.numbers.forEach((n: number) => {
                expect(n).toBeGreaterThan(0);
                expect(n).toBeLessThanOrEqual(100);
            });
        }
    });
});
