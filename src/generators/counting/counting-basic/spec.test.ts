import { beforeEach, describe, expect, it } from 'vitest';
import { CountingBasicGenerator } from './generator.ts';
import { setSeed } from '../../../lib/random.ts';
import { Scope } from 'edugraph-ts';
import { generateWithLabels } from '../../../lib/utils.ts';

describe('CountingBasicGenerator Spec Integration', () => {
    let generator: CountingBasicGenerator;

    beforeEach(() => {
        generator = new CountingBasicGenerator();
        setSeed(42);
    });

    it('should generate correct counting stubs using labels', () => {
        const stub = generateWithLabels(generator, [
            Scope.NumbersSmaller10
        ]);
        expect(stub).not.toBeNull();
        expect(stub!.data.numObjects).toBeGreaterThanOrEqual(1);
        expect(stub!.data.numObjects).toBeLessThanOrEqual(10);
        expect(stub!.data.simpleAnswer).toBe(stub!.data.numObjects);
    });

    it('should respect range boundaries from labels', () => {
        for (let i = 0; i < 20; i++) {
            const stub = generateWithLabels(generator, [
                Scope.NumbersSmaller20
            ]);
            expect(stub).not.toBeNull();
            expect(stub!.data.numObjects).toBeGreaterThanOrEqual(1);
            expect(stub!.data.numObjects).toBeLessThanOrEqual(20);
        }
    });

    it('should enforce minCount of at least 1 even if resolving to zero', () => {
        for (let i = 0; i < 20; i++) {
            const stub = generateWithLabels(generator, [
                Scope.NumbersSmaller10
            ]);
            expect(stub).not.toBeNull();
            expect(stub!.data.numObjects).toBeGreaterThanOrEqual(1);
            expect(stub!.data.numObjects).toBeLessThanOrEqual(10);
        }
    });
});
