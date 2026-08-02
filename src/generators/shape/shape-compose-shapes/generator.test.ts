import { beforeEach, describe, expect, it } from 'vitest';
import { ShapeComposeShapesGenerator } from './generator.ts';
import { setSeed } from '../../../lib/random.ts';
import { Area } from 'edugraph-ts';
import { GeneratorValidationError } from '../../../lib/errors.ts';

describe('ShapeComposeShapesGenerator', () => {
    let generator: ShapeComposeShapesGenerator;

    beforeEach(() => {
        generator = new ShapeComposeShapesGenerator();
        setSeed(42);
    });

    it('should have the correct type', () => {
        expect(generator.type).toBe('shape');
    });

    it('should throw validation error when no config is provided', () => {
        expect(() => generator.generate({} as any)).toThrow(GeneratorValidationError);
    });

    it('should generate rectangle when Rectangle is requested', () => {
        const stub = generator.generate({ classify: Area.Rectangle });
        expect(stub).not.toBeNull();
        expect(stub!.data.target).toBe('rectangle');
        expect(stub!.data.components).toEqual(['triangle', 'triangle']);
        expect(stub!.data.answer).toBe('Two triangles');
    });

    it('should generate square when Square is requested', () => {
        const stub = generator.generate({ classify: Area.Square });
        expect(stub).not.toBeNull();
        expect(stub!.data.target).toBe('square');
        expect(stub!.data.components).toEqual(['triangle', 'triangle']);
        expect(stub!.data.answer).toBe('Two triangles');
    });

    it.each([
        [Area.Triangle, 'triangle', 2, 'Two smaller triangles'],
        [Area.Hexagon, 'hexagon', 6, 'Six triangles'],
        [Area.Trapezoid, 'trapezoid', 3, 'Three triangles'],
        [Area.HalfCircle, 'half circle', 2, 'Two quarter circles'],
        [Area.QuarterCircle, 'quarter circle', 2, 'Two eighth-circle pieces'],
        [Area.Cube, 'cube', 2, 'Two rectangular prisms'],
        [Area.RectangularPrism, 'rectangular prism', 2, 'Two cubes'],
        [Area.Cone, 'cone', 2, 'Two half-cones'],
        [Area.Cylinder, 'cylinder', 2, 'Two shorter cylinders']
    ])('should generate a valid composition recipe for %s', (label, target, componentCount, answer) => {
        const stub = generator.generate({ classify: label });
        expect(stub).not.toBeNull();
        expect(stub!.data.target).toBe(target);
        expect(stub!.data.components).toHaveLength(componentCount);
        expect(stub!.data.options).toContain(answer);
        expect(stub!.data.answer).toBe(answer);
    });

    it('tags distinct ontology-backed component shapes without duplicating the configured target', () => {
        expect(generator.generate({classify: Area.Rectangle})!.tags).toEqual([Area.Triangle]);
        expect(generator.generate({classify: Area.RectangularPrism})!.tags).toEqual([Area.Cube]);
        expect(generator.generate({classify: Area.Cube})!.tags).toBeUndefined();
    });
});
