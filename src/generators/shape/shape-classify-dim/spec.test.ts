import { beforeEach, describe, expect, it } from 'vitest';
import { ShapeClassifyDimGenerator } from './generator.ts';
import { setSeed } from '../../../lib/random.ts';
import { Area, Scope } from 'edugraph-ts';
import { generateWithLabels } from '../../../lib/utils.ts';
import {spec, ShapeClassifyDimGeneratorSchema} from './spec.ts';

describe('ShapeClassifyDimGenerator Spec Integration', () => {
    let generator: ShapeClassifyDimGenerator;

    beforeEach(() => {
        generator = new ShapeClassifyDimGenerator();
        setSeed(42);
    });

    it('owns dimension as an explicit generator parameter rather than a global capability pair', () => {
        expect(spec.generalLabels).toEqual([Area.ShapeClassification, Scope.ShapeProperties]);
        expect(ShapeClassifyDimGeneratorSchema.dimension[0]).toEqual([
            Scope.TwoDimensional,
            Scope.ThreeDimensional
        ]);
    });

    it('should generate circle problem from Area.Circle label', () => {
        const stub = generateWithLabels(generator, [
            Area.Circle,
            Scope.ShapeProperties,
            Scope.TwoDimensional
        ]);
        expect(stub).not.toBeNull();
        expect(stub!.data.shapeType).toBe('2d');
        expect(stub!.data.shape).toBe('circle');
        expect(stub!.data.answer).toBe('2d');
        expect(stub!.tags).toEqual(expect.arrayContaining([Area.Circle, Scope.TwoDimensional]));
    });

    it('should generate sphere problem from Area.Sphere label', () => {
        const stub = generateWithLabels(generator, [
            Area.Sphere,
            Scope.ShapeProperties,
            Scope.ThreeDimensional
        ]);
        expect(stub).not.toBeNull();
        expect(stub!.data.shapeType).toBe('3d');
        expect(stub!.data.shape).toBe('sphere');
        expect(stub!.data.answer).toBe('3d');
        expect(stub!.tags).toEqual(expect.arrayContaining([Area.Sphere, Scope.ThreeDimensional]));
    });

});
