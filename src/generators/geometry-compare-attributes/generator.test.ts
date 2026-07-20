import { beforeEach, describe, expect, it } from 'vitest';
import { GeometryCompareAttributesGenerator } from './generator.ts';
import { setSeed } from '../../lib/random.ts';
import { Area } from 'edugraph-ts';

describe('GeometryCompareAttributesGenerator', () => {
    let generator: GeometryCompareAttributesGenerator;

    beforeEach(() => {
        generator = new GeometryCompareAttributesGenerator();
        setSeed(42);
    });

    it('should have the correct type', () => {
        expect(generator.type).toBe('geometry');
    });

    it('should generate problems using fallback when no config is provided', () => {
        const stub = generator.generate({});
        expect(stub).not.toBeNull();
        expect(stub!.data.shape1).toBeDefined();
        expect(stub!.data.shape2).toBeDefined();
        expect(stub!.data.shape1).not.toBe(stub!.data.shape2);
        expect(stub!.data.val1).not.toBe(stub!.data.val2);
    });

    it('should respect config constraints and compare different attribute counts', () => {
        const stub = generator.generate({ classify: Area.Triangle });
        expect(stub).not.toBeNull();
        expect(stub!.data.shape1).toBe('triangle');
        expect(stub!.data.shape2).not.toBe('triangle');
        expect(stub!.data.val1).not.toBe(stub!.data.val2);
    });

    it('should support circle and set values to 0', () => {
        const stub = generator.generate({ classify: Area.Circle });
        expect(stub).not.toBeNull();
        expect(stub!.data.shape1).toBe('circle');
        expect(stub!.data.val1).toBe(0);
        expect(stub!.data.shape2).not.toBe('circle');
        expect(stub!.data.val1).not.toBe(stub!.data.val2);
    });
});
