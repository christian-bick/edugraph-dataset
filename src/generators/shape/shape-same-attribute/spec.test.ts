import { beforeEach, describe, expect, it } from 'vitest';
import { ShapeSameAttributeGenerator } from './generator.ts';
import { setSeed } from '../../../lib/random.ts';
import { Area } from 'edugraph-ts';
import { generateWithLabels } from '../../../lib/utils.ts';

describe('ShapeSameAttributeGenerator Spec Integration', () => {
    let generator: ShapeSameAttributeGenerator;

    beforeEach(() => {
        generator = new ShapeSameAttributeGenerator();
        setSeed(42);
    });

    it('should generate Sphere answer from Area.Sphere label', () => {
        const stub = generateWithLabels(generator, [
            Area.Sphere
        ]);
        expect(stub).not.toBeNull();
        expect(stub!.data.answer).toBe('sphere');
    });

    it('should generate Cube answer from Area.Cube label', () => {
        const stub = generateWithLabels(generator, [
            Area.Cube
        ]);
        expect(stub).not.toBeNull();
        expect(stub!.data.answer).toBe('cube');
    });

    it('should generate Rectangle answer from Area.Rectangle label', () => {
        const stub = generateWithLabels(generator, [
            Area.Rectangle
        ]);
        expect(stub).not.toBeNull();
        expect(stub!.data.answer).toBe('rectangle');
    });
});
