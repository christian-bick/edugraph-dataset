import { beforeEach, describe, expect, it } from 'vitest';
import { ShapeBuildShapeGenerator } from './generator.ts';
import { setSeed } from '../../../lib/random.ts';
import { Area, Scope } from 'edugraph-ts';
import { generateWithLabels } from '../../../lib/utils.ts';

describe('ShapeBuildShapeGenerator Spec Integration', () => {
    let generator: ShapeBuildShapeGenerator;

    beforeEach(() => {
        generator = new ShapeBuildShapeGenerator();
        setSeed(42);
    });

    it('should generate triangle problem from Area.Triangle label', () => {
        const stub = generateWithLabels(generator, [
            Area.Triangle,
            Scope.ShapeProperties
        ]);
        expect(stub).not.toBeNull();
        expect(stub!.data.target).toBe('triangle');
        expect(stub!.data.sides).toBe(3);
        expect(stub!.data.corners).toBe(3);
    });

    it('should generate square problem from Area.Square label', () => {
        const stub = generateWithLabels(generator, [
            Area.Square,
            Scope.ShapeProperties
        ]);
        expect(stub).not.toBeNull();
        expect(stub!.data.target).toBe('square');
        expect(stub!.data.sides).toBe(4);
        expect(stub!.data.corners).toBe(4);
    });

    it('should generate rectangle problem from Area.Rectangle label', () => {
        const stub = generateWithLabels(generator, [
            Area.Rectangle,
            Scope.ShapeProperties
        ]);
        expect(stub).not.toBeNull();
        expect(stub!.data.target).toBe('rectangle');
        expect(stub!.data.sides).toBe(4);
        expect(stub!.data.corners).toBe(4);
    });

    it('should generate hexagon problem from Area.Hexagon label', () => {
        const stub = generateWithLabels(generator, [
            Area.Hexagon,
            Scope.ShapeProperties
        ]);
        expect(stub).not.toBeNull();
        expect(stub!.data.target).toBe('hexagon');
        expect(stub!.data.sides).toBe(6);
        expect(stub!.data.corners).toBe(6);
    });
});
