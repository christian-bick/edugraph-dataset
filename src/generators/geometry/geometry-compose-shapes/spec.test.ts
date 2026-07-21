import { beforeEach, describe, expect, it } from 'vitest';
import { GeometryComposeShapesGenerator } from './generator.ts';
import { setSeed } from '../../../lib/random.ts';
import { Area, Scope } from 'edugraph-ts';
import { generateWithLabels } from '../../../lib/utils.ts';

describe('GeometryComposeShapesGenerator Spec Integration', () => {
    let generator: GeometryComposeShapesGenerator;

    beforeEach(() => {
        generator = new GeometryComposeShapesGenerator();
        setSeed(42);
    });

    it('should generate rectangle compose problem from Area.Rectangle label', () => {
        const stub = generateWithLabels(generator, [
            Area.Rectangle,
            Scope.ShapeProperties
        ]);
        expect(stub).not.toBeNull();
        expect(stub!.data.target).toBe('rectangle');
        expect(stub!.data.components).toEqual(['triangles']);
        expect(stub!.data.answer).toBe('triangle');
    });

    it('should generate square compose problem from Area.Square label', () => {
        const stub = generateWithLabels(generator, [
            Area.Square,
            Scope.ShapeProperties
        ]);
        expect(stub).not.toBeNull();
        expect(stub!.data.target).toBe('square');
        expect(stub!.data.components).toEqual(['triangles']);
        expect(stub!.data.answer).toBe('triangle');
    });
});
