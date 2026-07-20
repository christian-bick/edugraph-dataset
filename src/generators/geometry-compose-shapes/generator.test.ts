import { beforeEach, describe, expect, it } from 'vitest';
import { GeometryComposeShapesGenerator } from './generator.ts';
import { setSeed } from '../../lib/random.ts';
import { Area } from 'edugraph-ts';
import { GeneratorValidationError } from '../../lib/errors.ts';

describe('GeometryComposeShapesGenerator', () => {
    let generator: GeometryComposeShapesGenerator;

    beforeEach(() => {
        generator = new GeometryComposeShapesGenerator();
        setSeed(42);
    });

    it('should have the correct type', () => {
        expect(generator.type).toBe('geometry');
    });

    it('should throw validation error when no config is provided', () => {
        expect(() => generator.generate({} as any)).toThrow(GeneratorValidationError);
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
