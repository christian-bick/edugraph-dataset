import {beforeEach, describe, expect, it} from 'vitest';
import {ShapePositionGenerator} from './generator.ts';
import {setSeed} from '../../../lib/random.ts';
import {Scope} from 'edugraph-ts';
import {GeneratorValidationError} from '../../../lib/errors.ts';

describe('ShapePositionGenerator', () => {
    let generator: ShapePositionGenerator;

    beforeEach(() => {
        generator = new ShapePositionGenerator();
        setSeed(42);
    });

    it('should have the correct type', () => {
        expect(generator.type).toBe('geometry');
    });

    it('should throw validation error when relations is missing or empty', () => {
        expect(() => generator.generate({} as any)).toThrow(GeneratorValidationError);
        expect(() => generator.generate({ relations: [] })).toThrow(GeneratorValidationError);
    });

    it('should validate position mode mappings', () => {
        const stub = generator.generate({
            relations: [Scope.Below]
        });
        expect(stub).not.toBeNull();
        expect(stub!.data.relation).toBe('below');
        expect(stub!.data.answer).toBe('below');
        expect(stub!.id).toBe('geometry-position-below');
    });
});
