import {beforeEach, describe, expect, it} from 'vitest';
import {ArithmeticOpsPairsGenerator} from './generator.ts';
import {setSeed} from '../../../lib/random.ts';
import {Area} from 'edugraph-ts';

describe('ArithmeticOpsPairsGenerator', () => {
    let generator: ArithmeticOpsPairsGenerator;

    beforeEach(() => {
        generator = new ArithmeticOpsPairsGenerator();
        setSeed(42);
    });

    it('should have the correct type', () => {
        expect(generator.type).toBe('arithmetic');
    });

    it('should throw validation error when range is missing', () => {
        expect(() => generator.generate({} as any)).toThrow();
    });

    it('should generate correct addition/subtraction/multiplication/division problems', () => {
        const addStub = generator.generate({
            operation: Area.Addition,
            allowNegatives: false,
            includeZero: false,
            range: { min: 1, max: 10 }
        });
        expect(addStub).not.toBeNull();
        expect(addStub!.data.operation).toBe('addition');

        const subStub = generator.generate({
            operation: Area.Subtraction,
            allowNegatives: false,
            includeZero: false,
            range: { min: 1, max: 10 }
        });
        expect(subStub).not.toBeNull();
        expect(subStub!.data.operation).toBe('subtraction');

        const mulStub = generator.generate({
            operation: Area.Multiplication,
            allowNegatives: false,
            includeZero: false,
            range: { min: 1, max: 10 }
        });
        expect(mulStub).not.toBeNull();
        expect(mulStub!.data.operation).toBe('multiplication');

        const divStub = generator.generate({
            operation: Area.Division,
            allowNegatives: false,
            includeZero: false,
            range: { min: 1, max: 10 }
        });
        expect(divStub).not.toBeNull();
        expect(divStub!.data.operation).toBe('division');
        expect(divStub!.data.num1).toBe(divStub!.data.answer * divStub!.data.num2);
        
        const zeroNegStub = generator.generate({
            operation: Area.Addition,
            allowNegatives: true,
            includeZero: true,
            range: { min: 0, max: 10 }
        });
        expect(zeroNegStub).not.toBeNull();
    });

    it('should generate correct physical arithmetic problems', () => {
        const addStub = generator.generate({
            operation: Area.Addition,
            allowNegatives: false,
            includeZero: false,
            range: { min: 1, max: 10 }
        });
        expect(addStub).not.toBeNull();
        expect(addStub!.data.operation).toBe('addition');
        expect(addStub!.data.num1).toBeGreaterThanOrEqual(1);
        expect(addStub!.data.num2).toBeGreaterThanOrEqual(1);
        expect(addStub!.data.answer).toBeLessThanOrEqual(10);
        expect(addStub!.data.num1 + addStub!.data.num2).toBe(addStub!.data.answer);

        const subStub = generator.generate({
            operation: Area.Subtraction,
            allowNegatives: false,
            includeZero: true, // Physical numbers subtraction might allow zero answer
            range: { min: 1, max: 10 }
        });
        expect(subStub).not.toBeNull();
        expect(subStub!.data.operation).toBe('subtraction');
        expect(subStub!.data.num1).toBeLessThanOrEqual(10);
        expect(subStub!.data.num1).toBeGreaterThan(subStub!.data.num2);
        expect(subStub!.data.answer).toBeGreaterThanOrEqual(0);
        expect(subStub!.data.num1 - subStub!.data.num2).toBe(subStub!.data.answer);
    });

});
