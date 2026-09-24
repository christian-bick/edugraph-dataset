import {describe, expect, it} from 'vitest';
import {Area} from 'edugraph-ts';
import {setSeed} from '../../../lib/random.ts';
import {ArithmeticWordProblemsLetterEquationGenerator} from './generator.ts';

describe('ArithmeticWordProblemsLetterEquationGenerator', () => {
    const generator = new ArithmeticWordProblemsLetterEquationGenerator();

    it('generates complete, consistent arithmetic-word-problems-letter-equation evidence', () => {
        for (let seed = 0; seed < 50; seed++) {
            setSeed(seed);
            const data = generator.generate({operations: [Area.Addition, Area.Addition], range: {min: 0, max: 1000}})!.data;
            expect(data.kind).toBe('letter-equation');
            expect(data.intermediate).toBe(data.operands[0] + data.operands[1]);
            expect(data.answer).toBe(data.intermediate + data.operands[2]);
        }
    });

    it('is deterministic for a seed and configuration', () => {
        setSeed('arithmetic-word-problems-letter-equation');
        const first = generator.generate({operations: [Area.Addition, Area.Addition], range: {min: 0, max: 1000}});
        setSeed('arithmetic-word-problems-letter-equation');
        expect(generator.generate({operations: [Area.Addition, Area.Addition], range: {min: 0, max: 1000}})).toEqual(first);
    });

    it('validates configuration before generating evidence', () => {
        expect(() => generator.generate(null as never)).toThrow();
        expect(() => generator.generate({})).toThrow();
        expect(generator.generate({operations: [Area.Addition, Area.Addition], range: {min: 1_000_000, max: 999_999}})).toBeNull();
        expect(generator.generate({operations: 'unsupported', range: {min: 0, max: 1000}})).toBeNull();
        expect(generator.generate({operations: [Area.Addition, Area.Addition], range: {min: 50, max: 51}})).toBeNull();
    });

});
