import { beforeEach, describe, expect, it } from 'vitest';
import { GeometryComposeShapesGenerator } from './generator.ts';
import { setSeed } from '../../lib/random.ts';
import { Area } from 'edugraph-ts';

describe('GeometryComposeShapesGenerator', () => {
    let generator: GeometryComposeShapesGenerator;

    beforeEach(() => {
        generator = new GeometryComposeShapesGenerator();
        setSeed(42);
    });

    it('should have the correct type', () => {
        expect(generator.type).toBe('geometry');
    });

    it('should validate compose-shapes outputs when no config is provided', () => {
        const stub = generator.generate({});
        expect(stub).not.toBeNull();
        expect(['rectangle', 'square']).toContain(stub!.data.target);
        expect(stub!.data.components).toEqual(['triangles']);
        expect(stub!.data.answer).toBe('triangle');
    });

    it('should generate rectangle when Rectangle is requested', () => {
        const stub = generator.generate({ classify: Area.Rectangle });
        expect(stub).not.toBeNull();
        expect(stub!.data.target).toBe('rectangle');
        expect(stub!.data.components).toEqual(['triangles']);
        expect(stub!.data.answer).toBe('triangle');
    });

    it('should generate square when Square is requested', () => {
        const stub = generator.generate({ classify: Area.Square });
        expect(stub).not.toBeNull();
        expect(stub!.data.target).toBe('square');
        expect(stub!.data.components).toEqual(['triangles']);
        expect(stub!.data.answer).toBe('triangle');
    });
});
