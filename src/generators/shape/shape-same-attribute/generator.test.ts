import {beforeEach, describe, expect, it} from 'vitest';
import {ShapeSameAttributeGenerator} from './generator.ts';
import {setSeed} from '../../../lib/random.ts';
import {GeneratorValidationError} from '../../../lib/errors.ts';

describe('ShapeSameAttributeGenerator', () => {
    let generator: ShapeSameAttributeGenerator;

    beforeEach(() => {
        generator = new ShapeSameAttributeGenerator();
        setSeed(42);
    });

    it('should have the correct type', () => {
        expect(generator.type).toBe('shape');
    });

    it('should throw validation error when shapes is missing or empty', () => {
        expect(() => generator.generate({} as any)).toThrow(GeneratorValidationError);
        expect(() => generator.generate({ shapes: [] })).toThrow(GeneratorValidationError);
    });

    it('should validate same-attribute rolls/stacks/folds properties', () => {
        const stubRoll = generator.generate({
            shapes: ['sphere']
        });
        expect(stubRoll).not.toBeNull();
        expect(stubRoll!.data.answer).toBe('sphere');
        expect(stubRoll!.data.attribute).toBe('rollable');

        const stubStack = generator.generate({
            shapes: ['cube']
        });
        expect(stubStack).not.toBeNull();
        expect(stubStack!.data.answer).toBe('cube');
        expect(stubStack!.data.attribute).toBe('stackable');

        const stubFold = generator.generate({
            shapes: ['rectangle']
        });
        expect(stubFold).not.toBeNull();
        expect(stubFold!.data.answer).toBe('rectangle');
        expect(stubFold!.data.attribute).toBe('foldable');
    });
});
