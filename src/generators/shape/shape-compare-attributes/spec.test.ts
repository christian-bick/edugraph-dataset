import { beforeEach, describe, expect, it } from 'vitest';
import { ShapeCompareAttributesGenerator } from './generator.ts';
import { setSeed } from '../../../lib/random.ts';
import { Area, Scope } from 'edugraph-ts';
import { generateWithLabels } from '../../../lib/utils.ts';

describe('ShapeCompareAttributesGenerator Spec Integration', () => {
    let generator: ShapeCompareAttributesGenerator;

    beforeEach(() => {
        generator = new ShapeCompareAttributesGenerator();
        setSeed(42);
    });

    it('should generate triangle comparison from Area.Triangle label', () => {
        const stub = generateWithLabels(generator, [
            Area.Triangle,
            Scope.ShapeProperties
        ]);
        expect(stub).not.toBeNull();
        expect(stub!.data.shape1).toBe('triangle');
        expect(stub!.data.shape2).not.toBe('triangle');
        expect(stub!.data.val1).toBe(3);
        expect(stub!.data.val1).not.toBe(stub!.data.val2);
    });

    it('should generate circle comparison from Area.Circle label', () => {
        const stub = generateWithLabels(generator, [
            Area.Circle,
            Scope.ShapeProperties
        ]);
        expect(stub).not.toBeNull();
        expect(stub!.data.shape1).toBe('circle');
        expect(stub!.data.shape2).not.toBe('circle');
        expect(stub!.data.val1).toBe(0);
        expect(stub!.data.val1).not.toBe(stub!.data.val2);
    });
});
