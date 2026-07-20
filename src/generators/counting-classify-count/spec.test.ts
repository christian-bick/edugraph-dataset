import { beforeEach, describe, expect, it } from 'vitest';
import { CountingClassifyCountGenerator } from './generator.ts';
import { setSeed } from '../../lib/random.ts';
import { Scope } from 'edugraph-ts';
import { generateWithLabels } from '../../lib/utils.ts';

describe('CountingClassifyCountGenerator Spec Integration', () => {
    let generator: CountingClassifyCountGenerator;

    beforeEach(() => {
        generator = new CountingClassifyCountGenerator();
        setSeed(42);
    });

    it('should generate classify-count problems using labels', () => {
        const stub = generateWithLabels(generator, [
            Scope.NumbersSmaller10,
        ]);
        expect(stub).not.toBeNull();
        expect(stub!.data.numObjects).toBeGreaterThanOrEqual(0);
        expect(stub!.data.numObjects).toBeLessThanOrEqual(10);
        expect(stub!.data.items.length).toBe(stub!.data.numObjects);
        
        const categories = stub!.data.categories;
        const total = (categories['A'] || 0) + (categories['B'] || 0) + (categories['C'] || 0);
        expect(total).toBe(stub!.data.numObjects);
    });

    it('should respect custom bounds from labels', () => {
        const stub = generateWithLabels(generator, [
            Scope.NumbersLarger10,
            Scope.NumbersSmaller20,
        ]);
        expect(stub).not.toBeNull();
        expect(stub!.data.numObjects).toBeGreaterThanOrEqual(10);
        expect(stub!.data.numObjects).toBeLessThanOrEqual(20);
    });
});
