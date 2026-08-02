import { beforeEach, describe, expect, it } from 'vitest';
import { ShapeComposeShapesGenerator } from './generator.ts';
import { setSeed } from '../../../lib/random.ts';
import { Area, Scope } from 'edugraph-ts';
import { generateWithLabels } from '../../../lib/utils.ts';

describe('ShapeComposeShapesGenerator Spec Integration', () => {
    let generator: ShapeComposeShapesGenerator;

    beforeEach(() => {
        generator = new ShapeComposeShapesGenerator();
        setSeed(42);
    });

    it('should generate rectangle compose problem from Area.Rectangle label', () => {
        const stub = generateWithLabels(generator, [
            Area.Rectangle,
            Scope.ShapeProperties
        ]);
        expect(stub).not.toBeNull();
        expect(stub!.data.target).toBe('rectangle');
        expect(stub!.data.components).toEqual(['triangle', 'triangle']);
        expect(stub!.data.answer).toBe('Two triangles');
    });

    it('should generate square compose problem from Area.Square label', () => {
        const stub = generateWithLabels(generator, [
            Area.Square,
            Scope.ShapeProperties
        ]);
        expect(stub).not.toBeNull();
        expect(stub!.data.target).toBe('square');
        expect(stub!.data.components).toEqual(['triangle', 'triangle']);
        expect(stub!.data.answer).toBe('Two triangles');
    });

    it.each([
        [Area.Triangle, 'triangle'],
        [Area.Hexagon, 'hexagon'],
        [Area.Trapezoid, 'trapezoid'],
        [Area.HalfCircle, 'half circle'],
        [Area.QuarterCircle, 'quarter circle'],
        [Area.Cube, 'cube'],
        [Area.RectangularPrism, 'rectangular prism'],
        [Area.Cone, 'cone'],
        [Area.Cylinder, 'cylinder']
    ])('should resolve %s into a %s composition', (label, target) => {
        const stub = generateWithLabels(generator, [label, Scope.ShapeProperties]);
        expect(stub).not.toBeNull();
        expect(stub!.data.target).toBe(target);
        expect(stub!.data.options).toContain(stub!.data.answer);
    });
});
