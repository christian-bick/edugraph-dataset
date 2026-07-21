import { beforeEach, describe, expect, it } from 'vitest';
import { ArithmeticDecomposeGenerator } from './generator.ts';
import { setSeed } from '../../../lib/random.ts';
import { Scope } from 'edugraph-ts';
import { generateWithLabels } from '../../../lib/utils.ts';

describe('ArithmeticDecomposeGenerator Spec Integration', () => {
    let generator: ArithmeticDecomposeGenerator;

    beforeEach(() => {
        generator = new ArithmeticDecomposeGenerator();
        setSeed(42);
    });

    it('should respect physical range bounds when using labels', () => {
        // Test NumbersSmaller10 (min 3, max 10)
        for (let i = 0; i < 20; i++) {
            const stub = generateWithLabels(generator, [
                Scope.NumbersSmaller10
            ]);
            expect(stub).not.toBeNull();
            const target = stub!.data.targetNumber;
            expect(target).toBeGreaterThanOrEqual(3);
            expect(target).toBeLessThanOrEqual(10);

            const p1 = stub!.data.pair1;
            const p2 = stub!.data.pair2;
            expect(p1[0] + p1[1]).toBe(target);
            expect(p2[0] + p2[1]).toBe(target);
            expect(p1[0] === p2[0] && p1[1] === p2[1]).toBe(false);
        }

        // Test NumbersSmaller20 (min 3, max 20)
        for (let i = 0; i < 20; i++) {
            const stub = generateWithLabels(generator, [
                Scope.NumbersSmaller20
            ]);
            expect(stub).not.toBeNull();
            const target = stub!.data.targetNumber;
            expect(target).toBeGreaterThanOrEqual(3);
            expect(target).toBeLessThanOrEqual(20);
        }

        // Test NumbersSmaller100 (min 3, max 99)
        for (let i = 0; i < 20; i++) {
            const stub = generateWithLabels(generator, [
                Scope.NumbersSmaller100
            ]);
            expect(stub).not.toBeNull();
            const target = stub!.data.targetNumber;
            expect(target).toBeGreaterThanOrEqual(3);
            expect(target).toBeLessThanOrEqual(99);
        }
    });
});
