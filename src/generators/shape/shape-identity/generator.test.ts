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

    it.each([
        [Area.Hexagon, 'hexagon'],
        [Area.Quadrilateral, 'quadrilateral'],
        [Area.Pentagon, 'pentagon']
    ] as const)('uses the provided %s shape', (label, shape) => {
        const stub = generator.generate({shapes: [label]});
        expect(stub).not.toBeNull();
        expect(stub!.data.shape).toBe(shape);
        expect(stub!.data.answer).toBe(shape);
        expect(stub!.tags).toBeUndefined();
    });
});
