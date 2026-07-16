import { describe, it, expect, beforeEach } from 'vitest';
import { ArithmeticGenerator } from './generator.ts';
import { setSeed } from '../../lib/random.ts';

describe('ArithmeticGenerator', () => {
    let generator: ArithmeticGenerator;

    beforeEach(() => {
        generator = new ArithmeticGenerator();
        setSeed(42);
    });

    it('should have the correct type', () => {
        expect(generator.type).toBe('arithmetic');
    });

    it('should generate correct standard mode problems', () => {
        const addStub = generator.generate({
            labels: ['http://edugraph.io/edu/Addition'],
            constraints: { digitsNum1: 1, digitsNum2: 1 }
        });
        expect(addStub).not.toBeNull();
        expect(addStub!.data.operation).toBe('addition');

        const subStub = generator.generate({
            labels: ['http://edugraph.io/edu/Subtraction'],
            constraints: { digitsNum1: 1, digitsNum2: 1 }
        });
        expect(subStub).not.toBeNull();
        expect(subStub!.data.operation).toBe('subtraction');

        const mulStub = generator.generate({
            labels: ['http://edugraph.io/edu/Multiplication'],
            constraints: { digitsNum1: 1, digitsNum2: 1 }
        });
        expect(mulStub).not.toBeNull();
        expect(mulStub!.data.operation).toBe('multiplication');

        const divStub = generator.generate({
            labels: ['http://edugraph.io/edu/Division'],
            constraints: { digitsNum1: 1, digitsNum2: 1 }
        });
        expect(divStub).not.toBeNull();
        expect(divStub!.data.operation).toBe('division');
        expect(divStub!.data.num1).toBe(divStub!.data.answer * divStub!.data.num2);
        
        const zeroNegStub = generator.generate({
            labels: ['http://edugraph.io/edu/Addition', 'http://edugraph.io/edu/NumbersWithZero', 'http://edugraph.io/edu/NumbersWithNegatives'],
            constraints: { digitsNum1: 1, digitsNum2: 1 }
        });
        expect(zeroNegStub).not.toBeNull();
    });

    it('should return null for non-standard modes', () => {
        const stub = generator.generate({
            labels: [],
            constraints: { mode: 'decompose' }
        });
        expect(stub).toBeNull();
    });
});
