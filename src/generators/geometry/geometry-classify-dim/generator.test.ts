import {beforeEach, describe, expect, it} from 'vitest';
import {GeometryClassifyDimGenerator} from './generator.ts';
import {setSeed} from '../../../lib/random.ts';
import {Area} from 'edugraph-ts';

describe('GeometryClassifyDimGenerator', () => {
    let generator: GeometryClassifyDimGenerator;

    beforeEach(() => {
        generator = new GeometryClassifyDimGenerator();
        setSeed(42);
    });

    it('should have the correct type', () => {
        expect(generator.type).toBe('geometry');
    });

    it('should throw GeneratorValidationError when config is empty', () => {
        expect(() => generator.generate({})).toThrow();
    });

    it('should generate 2D circle when circle is requested', () => {
        const stub = generator.generate({ classify: Area.Circle });
        expect(stub).not.toBeNull();
        expect(stub!.data.shapeType).toBe('2d');
        expect(stub!.data.shape).toBe('circle');
        expect(stub!.data.answer).toBe('2d');
    });

    it('should generate 2D shapes for square, rectangle, triangle, hexagon', () => {
        const shapes = [
            { label: Area.Square, name: 'square' },
            { label: Area.Rectangle, name: 'rectangle' },
            { label: Area.Triangle, name: 'triangle' },
            { label: Area.Hexagon, name: 'hexagon' }
        ];
        shapes.forEach(({ label, name }) => {
            const stub = generator.generate({ classify: label });
            expect(stub).not.toBeNull();
            expect(stub!.data.shapeType).toBe('2d');
            expect(stub!.data.shape).toBe(name);
        });
    });

    it('should generate 3D sphere when sphere is requested', () => {
        const stub = generator.generate({ classify: Area.Sphere });
        expect(stub).not.toBeNull();
        expect(stub!.data.shapeType).toBe('3d');
        expect(stub!.data.shape).toBe('sphere');
        expect(stub!.data.answer).toBe('3d');
    });

    it('should generate 3D shapes for cube, cone, cylinder', () => {
        const shapes = [
            { label: Area.Cube, name: 'cube' },
            { label: Area.Cone, name: 'cone' },
            { label: Area.Cylinder, name: 'cylinder' }
        ];
        shapes.forEach(({ label, name }) => {
            const stub = generator.generate({ classify: label });
            expect(stub).not.toBeNull();
            expect(stub!.data.shapeType).toBe('3d');
            expect(stub!.data.shape).toBe(name);
        });
    });

    it('should return null for unrecognized classify label', () => {
        const stub = generator.generate({ classify: 'unrecognized-label' as any });
        expect(stub).toBeNull();
    });
});
