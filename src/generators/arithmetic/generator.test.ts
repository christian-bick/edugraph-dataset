import {beforeEach, describe, expect, it} from 'vitest';
import {ArithmeticGenerator} from './generator.ts';
import {setSeed} from '../../lib/random.ts';

describe('ArithmeticGenerator', () => {
    let generator: ArithmeticGenerator;

    beforeEach(() => {
        generator = new ArithmeticGenerator();
        setSeed(42);
    });

    it('should have the correct type', () => {
        expect(generator.type).toBe('arithmetic');
    });

    it('should generate correct addition/subtraction/multiplication/division problems', () => {
        const addStub = generator.generate({
            labels: ['http://edugraph.io/edu/Addition']
        });
        expect(addStub).not.toBeNull();
        expect(addStub!.data.operation).toBe('addition');

        const subStub = generator.generate({
            labels: ['http://edugraph.io/edu/Subtraction']
        });
        expect(subStub).not.toBeNull();
        expect(subStub!.data.operation).toBe('subtraction');

        const mulStub = generator.generate({
            labels: ['http://edugraph.io/edu/Multiplication']
        });
        expect(mulStub).not.toBeNull();
        expect(mulStub!.data.operation).toBe('multiplication');

        const divStub = generator.generate({
            labels: ['http://edugraph.io/edu/Division']
        });
        expect(divStub).not.toBeNull();
        expect(divStub!.data.operation).toBe('division');
        expect(divStub!.data.num1).toBe(divStub!.data.answer * divStub!.data.num2);
        
        const zeroNegStub = generator.generate({
            labels: ['http://edugraph.io/edu/Addition', 'http://edugraph.io/edu/NumbersWithZero', 'http://edugraph.io/edu/NumbersWithNegatives']
        });
        expect(zeroNegStub).not.toBeNull();
    });

    it('should generate correct physical arithmetic problems', () => {
        const addStub = generator.generate({
            labels: ['http://edugraph.io/edu/Addition', 'http://edugraph.io/edu/PhysicalNumbers']
        });
        expect(addStub).not.toBeNull();
        expect(addStub!.data.operation).toBe('addition');
        expect(addStub!.data.num1).toBeGreaterThanOrEqual(1);
        expect(addStub!.data.num2).toBeGreaterThanOrEqual(1);
        expect(addStub!.data.answer).toBeLessThanOrEqual(10);
        expect(addStub!.data.num1 + addStub!.data.num2).toBe(addStub!.data.answer);

        const subStub = generator.generate({
            labels: ['http://edugraph.io/edu/Subtraction', 'http://edugraph.io/edu/PhysicalNumbers']
        });
        expect(subStub).not.toBeNull();
        expect(subStub!.data.operation).toBe('subtraction');
        expect(subStub!.data.num1).toBeLessThanOrEqual(10);
        expect(subStub!.data.num1).toBeGreaterThan(subStub!.data.num2);
        expect(subStub!.data.answer).toBeGreaterThanOrEqual(0);
        expect(subStub!.data.num1 - subStub!.data.num2).toBe(subStub!.data.answer);
    });

});
