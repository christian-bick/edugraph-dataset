import {beforeEach, describe, expect, it} from 'vitest';
import {GeometryClassifyDimGenerator} from './generator.ts';
import {setSeed} from '../../lib/random.ts';
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

    it('should validate random fallback when config is empty', () => {
        const stub = generator.generate({});
        expect(stub).not.toBeNull();
        expect(['2d', '3d']).toContain(stub!.data.shapeType);
        expect(stub!.data.answer).toBe(stub!.data.shapeType);
    });

    it('should generate 2D circle when circle is requested', () => {
        const stub = generator.generate({ classify: Area.Circle });
        expect(stub).not.toBeNull();
        expect(stub!.data.shapeType).toBe('2d');
        expect(stub!.data.shape).toBe('circle');
        expect(stub!.data.answer).toBe('2d');
    });

    it('should generate 3D sphere when sphere is requested', () => {
        const stub = generator.generate({ classify: Area.Sphere });
        expect(stub).not.toBeNull();
        expect(stub!.data.shapeType).toBe('3d');
        expect(stub!.data.shape).toBe('sphere');
        expect(stub!.data.answer).toBe('3d');
    });
});
