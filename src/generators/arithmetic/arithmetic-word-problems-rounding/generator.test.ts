import {describe, expect, it} from 'vitest';
import {Area} from 'edugraph-ts';
import {setSeed} from '../../../lib/random.ts';
import {ArithmeticWordProblemsRoundingGenerator} from './generator.ts';

describe('ArithmeticWordProblemsRoundingGenerator', () => {
    const generator = new ArithmeticWordProblemsRoundingGenerator();

    it('generates complete, consistent arithmetic-word-problems-rounding evidence', () => {
        for (let seed = 0; seed < 50; seed++) {
            setSeed(seed);
            const data = generator.generate({operations: [Area.Addition, Area.Addition], range: {min: 0, max: 1000}})!.data;
            expect(data.kind).toBe('rounding');
            expect(data.intermediate).toBe(data.operands[0] + data.operands[1]);
            expect(data.answer).toBe(data.intermediate + data.operands[2]);
            expect(data.roundedAnswer).toBe(Math.round(data.answer / data.roundingPlace) * data.roundingPlace);
        }
    });

    it('is deterministic for a seed and configuration', () => {
        setSeed('arithmetic-word-problems-rounding');
        const first = generator.generate({operations: [Area.Addition, Area.Addition], range: {min: 0, max: 1000}});
        setSeed('arithmetic-word-problems-rounding');
        expect(generator.generate({operations: [Area.Addition, Area.Addition], range: {min: 0, max: 1000}})).toEqual(first);
    });

    it.each([Area.Addition, Area.Subtraction, Area.Multiplication, Area.Division] as const)(
        'keeps rounded results positive for %s, including small subtraction answers', operation => {
            for (let seed = 0; seed < 100; seed++) {
                setSeed(seed);
                const data = generator.generate({operations: [operation, operation], range: {min: 1, max: 1000}})!.data;
                expect(data.roundedAnswer).toBeGreaterThan(0);
                expect(data.roundedAnswer).toBe(Math.round(data.answer / data.roundingPlace) * data.roundingPlace);
            }
        }
    );

    it('validates configuration before generating evidence', () => {
        expect(() => generator.generate(null as never)).toThrow();
        expect(() => generator.generate({})).toThrow();
        expect(generator.generate({operations: [Area.Addition, Area.Addition], range: {min: 1_000_000, max: 999_999}})).toBeNull();
        expect(generator.generate({operations: 'unsupported', range: {min: 0, max: 1000}})).toBeNull();
        expect(generator.generate({operations: [Area.Addition, Area.Addition], range: {min: 50, max: 51}})).toBeNull();
    });

});
