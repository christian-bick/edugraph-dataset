import {beforeEach, describe, expect, it} from 'vitest';
import {GeometryIdentityGenerator} from './generator.ts';
import {setSeed} from '../../lib/random.ts';
import {Area} from 'edugraph-ts';
import {GeneratorValidationError} from '../../lib/errors.ts';

describe('GeometryIdentityGenerator', () => {
    let generator: GeometryIdentityGenerator;

    beforeEach(() => {
        generator = new GeometryIdentityGenerator();
        setSeed(42);
    });

    it('should have the correct type', () => {
        expect(generator.type).toBe('geometry');
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
        expect(stub!.id).toBe('geometry-identity-hexagon');
    });
});
