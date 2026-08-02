import {beforeEach, describe, expect, it} from 'vitest';
import {ShapeBuildShapeGenerator} from './generator.ts';
import {setSeed} from '../../../lib/random.ts';
import {Area} from 'edugraph-ts';
import {GeneratorValidationError} from '../../../lib/errors.ts';

describe('ShapeBuildShapeGenerator', () => {
    let generator: ShapeBuildShapeGenerator;

    beforeEach(() => {
        generator = new ShapeBuildShapeGenerator();
        setSeed(42);
    });

    it('should have the correct type', () => {
        expect(generator.type).toBe('shape');
    });

    it('should generate triangle details correctly', () => {
        const stub = generator.generate({ target: Area.Triangle });
        expect(stub).not.toBeNull();
        expect(stub!.data.target).toBe('triangle');
        expect(stub!.data.sides).toBe(3);
        expect(stub!.data.corners).toBe(3);
        expect(stub!.data.attributes.filter(attribute => attribute.defining).map(attribute => attribute.label))
            .toEqual(['3 straight sides', '3 corners', 'a closed outline']);
    });

    it('should generate square details correctly', () => {
        const stub = generator.generate({ target: Area.Square });
        expect(stub).not.toBeNull();
        expect(stub!.data.target).toBe('square');
        expect(stub!.data.sides).toBe(4);
        expect(stub!.data.corners).toBe(4);
        expect(stub!.data.attributes.some(attribute => attribute.label === '4 equal straight sides' && attribute.defining)).toBe(true);
    });

    it('should generate rectangle details correctly', () => {
        const stub = generator.generate({ target: Area.Rectangle });
        expect(stub).not.toBeNull();
        expect(stub!.data.target).toBe('rectangle');
        expect(stub!.data.sides).toBe(4);
        expect(stub!.data.corners).toBe(4);
        expect(stub!.data.attributes.some(attribute => attribute.label === 'opposite sides equal' && attribute.defining)).toBe(true);
    });

    it('should generate hexagon details correctly', () => {
        const stub = generator.generate({ target: Area.Hexagon });
        expect(stub).not.toBeNull();
        expect(stub!.data.target).toBe('hexagon');
        expect(stub!.data.sides).toBe(6);
        expect(stub!.data.corners).toBe(6);
        expect(stub!.data.attributes.some(attribute => attribute.label === '6 straight sides' && attribute.defining)).toBe(true);
    });

    it('marks color, size, and orientation as non-defining for every target', () => {
        const stub = generator.generate({target: Area.Square})!;
        expect(stub.data.attributes.filter(attribute => !attribute.defining).map(attribute => attribute.label))
            .toEqual(['its color', 'its size', 'the direction it points']);
        expect(stub.tags).toBeUndefined();
    });

    it('should throw validation error if target is not specified', () => {
        expect(() => generator.generate({} as any)).toThrow(GeneratorValidationError);
    });
});
