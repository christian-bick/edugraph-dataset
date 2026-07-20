import { beforeEach, describe, expect, it } from 'vitest';
import { GeometryCompareAttributesGenerator } from './generator.ts';
import { setSeed } from '../../lib/random.ts';
import { Area } from 'edugraph-ts';
import { GeneratorValidationError } from '../../lib/errors.ts';

describe('GeometryCompareAttributesGenerator', () => {
    let generator: GeometryCompareAttributesGenerator;

    beforeEach(() => {
        generator = new GeometryCompareAttributesGenerator();
        setSeed(42);
    });

    it('should have the correct type', () => {
        expect(generator.type).toBe('geometry');
    });

    it('should throw validation error when no config is provided', () => {
        expect(() => generator.generate({} as any)).toThrow(GeneratorValidationError);
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

    it('should support square, rectangle, and hexagon', () => {
        const labels = [Area.Square, Area.Rectangle, Area.Hexagon];
        labels.forEach(label => {
            const stub = generator.generate({ classify: label });
            expect(stub).not.toBeNull();
            expect(stub!.data.val1).toBeGreaterThan(0);
        });
    });

    it('should return null for unrecognized classify label', () => {
        const stub = generator.generate({ classify: 'unrecognized-label' as any });
        expect(stub).toBeNull();
    });
});
