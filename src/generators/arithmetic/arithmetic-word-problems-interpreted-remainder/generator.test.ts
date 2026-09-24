import {describe, expect, it} from 'vitest';
import {setSeed} from '../../../lib/random.ts';
import {ArithmeticWordProblemsInterpretedRemainderGenerator} from './generator.ts';

describe('ArithmeticWordProblemsInterpretedRemainderGenerator', () => {
    const generator = new ArithmeticWordProblemsInterpretedRemainderGenerator();

    it('generates complete, consistent arithmetic-word-problems-interpreted-remainder evidence', () => {
        for (let seed = 0; seed < 50; seed++) {
            setSeed(seed);
            const data = generator.generate({range: {min: 0, max: 1000}})!.data;
            expect(data.kind).toBe('interpreted-remainder');
            expect(data.dividend).toBe(data.divisor * data.quotient + data.remainder);
            expect(data.remainder).toBeGreaterThan(0);
            expect(data.remainder).toBeLessThan(data.divisor);
        }
    });

    it('is deterministic for a seed and configuration', () => {
        setSeed('arithmetic-word-problems-interpreted-remainder');
        const first = generator.generate({range: {min: 0, max: 1000}});
        setSeed('arithmetic-word-problems-interpreted-remainder');
        expect(generator.generate({range: {min: 0, max: 1000}})).toEqual(first);
    });

    it('validates configuration before generating evidence', () => {
        expect(() => generator.generate(null as never)).toThrow();
        expect(() => generator.generate({})).toThrow();
        expect(generator.generate({range: {min: 1_000_000, max: 999_999}})).toBeNull();
    });

});
