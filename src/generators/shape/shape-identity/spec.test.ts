import { beforeEach, describe, expect, it } from 'vitest';
import { ShapeIdentityGenerator } from './generator.ts';
import { setSeed } from '../../../lib/random.ts';
import { Area } from 'edugraph-ts';
import { generateWithLabels } from '../../../lib/utils.ts';

describe('ShapeIdentityGenerator Spec Integration', () => {
    let generator: ShapeIdentityGenerator;

    beforeEach(() => {
        generator = new ShapeIdentityGenerator();
        setSeed(42);
    });

    it('should generate triangle problem from Area.Triangle label', () => {
        const stub = generateWithLabels(generator, [
            Area.Triangle
        ]);
        expect(stub).not.toBeNull();
        expect(stub!.data.shape).toBe('triangle');
        expect(stub!.data.answer).toBe('triangle');
    });

    it('should generate hexagon problem from Area.Hexagon label', () => {
        const stub = generateWithLabels(generator, [
            Area.Hexagon
        ]);
        expect(stub).not.toBeNull();
        expect(stub!.data.shape).toBe('hexagon');
        expect(stub!.data.answer).toBe('hexagon');
    });

    it('should generate cylinder problem from Area.Cylinder label', () => {
        const stub = generateWithLabels(generator, [
            Area.Cylinder
        ]);
        expect(stub).not.toBeNull();
        expect(stub!.data.shape).toBe('cylinder');
        expect(stub!.data.answer).toBe('cylinder');
    });
});
