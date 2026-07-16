import { describe, it, expect, beforeEach } from 'vitest';
import { ArithmeticWordProblemGenerator } from './generator.ts';
import { setSeed } from '../../lib/random.ts';

describe('ArithmeticWordProblemGenerator', () => {
    let generator: ArithmeticWordProblemGenerator;

    beforeEach(() => {
        generator = new ArithmeticWordProblemGenerator();
        setSeed(42);
    });

    it('should have the correct type', () => {
        expect(generator.type).toBe('arithmetic');
    });

    it('should generate non-empty scenario text for word problems', () => {
        const input = {
            labels: [],
            constraints: { mode: 'word-problem', operation: 'addition', maxSum: 10 }
        };
        const stub = generator.generate(input);
        expect(stub).not.toBeNull();
        expect(stub!.data.mode).toBe('word-problem');
        expect(stub!.data.textScenario).toMatch(/\w+/);
        expect(stub!.data.textScenario).toContain(String(stub!.data.num1));
        expect(stub!.data.textScenario).toContain(String(stub!.data.num2));
    });

    it('should return null for non-word-problem modes', () => {
        const stub = generator.generate({
            labels: [],
            constraints: { mode: 'standard' }
        });
        expect(stub).toBeNull();
    });
});
