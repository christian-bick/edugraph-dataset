import {Area} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {GeneratorValidationError} from '../../../lib/errors.ts';
import {setSeed} from '../../../lib/random.ts';
import {ShapeComparisonAttribute, ShapeComparisonName} from '../../../types/problems.ts';
import {ShapeCompareAttributesGenerator} from './generator.ts';

const CASES = [
    [Area.Triangle, 'triangle', '2d'],
    [Area.Square, 'square', '2d'],
    [Area.Rectangle, 'rectangle', '2d'],
    [Area.Hexagon, 'hexagon', '2d'],
    [Area.Circle, 'circle', '2d'],
    [Area.Cube, 'cube', '3d'],
    [Area.Cone, 'cone', '3d'],
    [Area.Cylinder, 'cylinder', '3d'],
    [Area.Sphere, 'sphere', '3d']
] as const;

const COUNTS: Readonly<Record<ShapeComparisonName, Partial<Record<ShapeComparisonAttribute, number>>>> = {
    triangle: {sides: 3, vertices: 3},
    square: {sides: 4, vertices: 4},
    rectangle: {sides: 4, vertices: 4},
    hexagon: {sides: 6, vertices: 6},
    circle: {sides: 0, vertices: 0},
    cube: {faces: 6, vertices: 8, edges: 12},
    cone: {faces: 1, vertices: 1, edges: 1},
    cylinder: {faces: 2, vertices: 0, edges: 2},
    sphere: {faces: 0, vertices: 0, edges: 0}
};

const SHAPE_LABELS: Readonly<Record<ShapeComparisonName, string>> = {
    triangle: Area.Triangle,
    square: Area.Square,
    rectangle: Area.Rectangle,
    hexagon: Area.Hexagon,
    circle: Area.Circle,
    cube: Area.Cube,
    cone: Area.Cone,
    cylinder: Area.Cylinder,
    sphere: Area.Sphere
};

describe('ShapeCompareAttributesGenerator', () => {
    const generator = new ShapeCompareAttributesGenerator();

    it('has the shape problem type', () => {
        expect(generator.type).toBe('shape');
    });

    it('rejects missing and unsupported shape configuration', () => {
        expect(() => generator.generate({} as never)).toThrow(GeneratorValidationError);
        expect(() => generator.generate({shape: 'unsupported'} as never)).toThrow(GeneratorValidationError);
    });

    it.each(CASES)('authors coherent same-dimensional comparisons for %s', (label, expectedShape, dimension) => {
        const seenAttributes = new Set<ShapeComparisonAttribute>();

        for (let seed = 0; seed < 100; seed++) {
            setSeed(seed);
            const stub = generator.generate({shape: label});
            const data = stub.data;
            const [first, second] = data.shapes;

            seenAttributes.add(data.attribute);
            expect(data.dimension).toBe(dimension);
            expect(first.shape).toBe(expectedShape);
            expect(second.shape).not.toBe(first.shape);
            expect(COUNTS[first.shape][data.attribute]).toBe(first.count);
            expect(COUNTS[second.shape][data.attribute]).toBe(second.count);
            expect(first.count).not.toBe(second.count);
            expect(data.answer).toBe(first.count > second.count ? first.shape : second.shape);
            expect(data.relation).toBe('more');
            expect(data.prompt).toMatch(/^Which shape has more /);
            expect(data.evidence).toHaveLength(3);
            expect(data.evidence[2]).toContain('>');
            expect(data.evidence[2]).toContain(data.answer.charAt(0).toUpperCase() + data.answer.slice(1));
            expect(stub.tags).toEqual([SHAPE_LABELS[second.shape]]);
        }

        expect(seenAttributes).toEqual(new Set(
            dimension === '2d' ? ['sides', 'vertices'] : ['faces', 'vertices', 'edges']
        ));
    });
});
