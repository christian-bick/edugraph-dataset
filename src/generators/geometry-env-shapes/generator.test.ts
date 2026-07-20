import { beforeEach, describe, expect, it } from 'vitest';
import { GeometryEnvShapesGenerator } from './generator.ts';
import { setSeed } from '../../lib/random.ts';
import { Area } from 'edugraph-ts';
import { GeneratorValidationError } from '../../lib/errors.ts';

describe('GeometryEnvShapesGenerator', () => {
    let generator: GeometryEnvShapesGenerator;

    beforeEach(() => {
        generator = new GeometryEnvShapesGenerator();
        setSeed(42);
    });

    it('should have the correct type', () => {
        expect(generator.type).toBe('geometry');
    });

    it('should throw validation error when no config is provided', () => {
        expect(() => generator.generate({} as any)).toThrow(GeneratorValidationError);
    });

    it('should generate clock when Circle is requested', () => {
        const stub = generator.generate({ classify: Area.Circle });
        expect(stub).not.toBeNull();
        expect(stub!.data.answer).toBe('circle');
        expect(stub!.data.target).toBe('clock');
    });

    it('should generate window when Square is requested', () => {
        const stub = generator.generate({ classify: Area.Square });
        expect(stub).not.toBeNull();
        expect(stub!.data.answer).toBe('square');
        expect(stub!.data.target).toBe('window');
    });

    it('should generate table when Rectangle is requested', () => {
        const stub = generator.generate({ classify: Area.Rectangle });
        expect(stub).not.toBeNull();
        expect(stub!.data.answer).toBe('rectangle');
        expect(stub!.data.target).toBe('table');
    });
});
