import {beforeEach, describe, expect, it} from 'vitest';
import {ShapeIdentityGenerator} from './generator.ts';
import {setSeed} from '../../../lib/random.ts';
import {Area} from 'edugraph-ts';
import {GeneratorValidationError} from '../../../lib/errors.ts';

describe('ShapeIdentityGenerator', () => {
    let generator: ShapeIdentityGenerator;

    beforeEach(() => {
        generator = new ShapeIdentityGenerator();
        setSeed(42);
    });

    it('should have the correct type', () => {
        expect(generator.type).toBe('shape');
    });

    it('should throw validation error if no shapes provided or config is empty', () => {
        expect(() => generator.generate({} as any)).toThrow(GeneratorValidationError);
        expect(() => generator.generate({ shapes: [] })).toThrow(GeneratorValidationError);
    });

    it('should use provided shapes', () => {
        const stub = generator.generate({ shapes: [Area.Hexagon] });
        expect(stub).not.toBeNull();
        expect(stub!.data.shape).toBe('hexagon');
        expect(stub!.data.answer).toBe('hexagon');
    });
});
