import { beforeEach, describe, expect, it } from 'vitest';
import { GeometryEnvShapesGenerator } from './generator.ts';
import { setSeed } from '../../../lib/random.ts';
import { Area, Scope } from 'edugraph-ts';
import { generateWithLabels } from '../../../lib/utils.ts';

describe('GeometryEnvShapesGenerator Spec Integration', () => {
    let generator: GeometryEnvShapesGenerator;

    beforeEach(() => {
        generator = new GeometryEnvShapesGenerator();
        setSeed(42);
    });

    it('should generate clock env-shape from Area.Circle label', () => {
        const stub = generateWithLabels(generator, [
            Area.Circle,
            Scope.ShapeProperties
        ]);
        expect(stub).not.toBeNull();
        expect(stub!.data.answer).toBe('circle');
        expect(stub!.data.target).toBe('clock');
    });

    it('should generate window env-shape from Area.Square label', () => {
        const stub = generateWithLabels(generator, [
            Area.Square,
            Scope.ShapeProperties
        ]);
        expect(stub).not.toBeNull();
        expect(stub!.data.answer).toBe('square');
        expect(stub!.data.target).toBe('window');
    });

    it('should generate table env-shape from Area.Rectangle label', () => {
        const stub = generateWithLabels(generator, [
            Area.Rectangle,
            Scope.ShapeProperties
        ]);
        expect(stub).not.toBeNull();
        expect(stub!.data.answer).toBe('rectangle');
        expect(stub!.data.target).toBe('table');
    });
});
