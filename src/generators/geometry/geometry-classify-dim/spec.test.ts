import { beforeEach, describe, expect, it } from 'vitest';
import { GeometryClassifyDimGenerator } from './generator.ts';
import { setSeed } from '../../../lib/random.ts';
import { Area, Scope } from 'edugraph-ts';
import { generateWithLabels } from '../../../lib/utils.ts';

describe('GeometryClassifyDimGenerator Spec Integration', () => {
    let generator: GeometryClassifyDimGenerator;

    beforeEach(() => {
        generator = new GeometryClassifyDimGenerator();
        setSeed(42);
    });

    it('should generate circle problem from Area.Circle label', () => {
        const stub = generateWithLabels(generator, [
            Area.Circle,
            Scope.ShapeProperties
        ]);
        expect(stub).not.toBeNull();
        expect(stub!.data.shapeType).toBe('2d');
        expect(stub!.data.shape).toBe('circle');
        expect(stub!.data.answer).toBe('2d');
    });

    it('should generate sphere problem from Area.Sphere label', () => {
        const stub = generateWithLabels(generator, [
            Area.Sphere,
            Scope.ShapeProperties
        ]);
        expect(stub).not.toBeNull();
        expect(stub!.data.shapeType).toBe('3d');
        expect(stub!.data.shape).toBe('sphere');
        expect(stub!.data.answer).toBe('3d');
    });
});
