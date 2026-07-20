import {beforeEach, describe, expect, it} from 'vitest';
import {GeometryBuildShapeGenerator} from './generator.ts';
import {setSeed} from '../../lib/random.ts';
import {Area} from 'edugraph-ts';
import {GeneratorValidationError} from '../../lib/errors.ts';

describe('GeometryBuildShapeGenerator', () => {
    let generator: GeometryBuildShapeGenerator;

    beforeEach(() => {
        generator = new GeometryBuildShapeGenerator();
        setSeed(42);
    });

    it('should have the correct type', () => {
        expect(generator.type).toBe('geometry');
    });

    it('should generate triangle details correctly', () => {
        const stub = generator.generate({ target: Area.Triangle });
        expect(stub).not.toBeNull();
        expect(stub!.data.target).toBe('triangle');
        expect(stub!.data.sides).toBe(3);
        expect(stub!.data.corners).toBe(3);
    });

    it('should generate square details correctly', () => {
        const stub = generator.generate({ target: Area.Square });
        expect(stub).not.toBeNull();
        expect(stub!.data.target).toBe('square');
        expect(stub!.data.sides).toBe(4);
        expect(stub!.data.corners).toBe(4);
    });

    it('should generate rectangle details correctly', () => {
        const stub = generator.generate({ target: Area.Rectangle });
        expect(stub).not.toBeNull();
        expect(stub!.data.target).toBe('rectangle');
        expect(stub!.data.sides).toBe(4);
        expect(stub!.data.corners).toBe(4);
    });

    it('should generate hexagon details correctly', () => {
        const stub = generator.generate({ target: Area.Hexagon });
        expect(stub).not.toBeNull();
        expect(stub!.data.target).toBe('hexagon');
        expect(stub!.data.sides).toBe(6);
        expect(stub!.data.corners).toBe(6);
    });

    it('should throw validation error if target is not specified', () => {
        expect(() => generator.generate({} as any)).toThrow(GeneratorValidationError);
    });
});
