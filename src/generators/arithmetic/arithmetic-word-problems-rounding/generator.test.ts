import {afterEach, describe, expect, it, vi} from 'vitest';
import {Area} from 'edugraph-ts';
import {setSeed} from '../../../lib/random.ts';
import * as rng from '../../../lib/random.ts';
import {ArithmeticWordProblemsRoundingGenerator} from './generator.ts';

afterEach(() => vi.restoreAllMocks());

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
            expect(data.numberDomain).toEqual({min: 1, max: 1000});
            expect(data.proposal.proposedAnswer).not.toBe(data.answer);
            expect(data.proposal.roundedProposedAnswer)
                .toBe(Math.round(data.proposal.proposedAnswer / data.roundingPlace) * data.roundingPlace);
            for (const value of [...data.operands, data.intermediate, data.answer, data.roundedAnswer,
                data.proposal.proposedAnswer, data.proposal.roundedProposedAnswer]) {
                expect(Number.isSafeInteger(value)).toBe(true);
                expect(value).toBeGreaterThanOrEqual(data.numberDomain.min);
                expect(value).toBeLessThanOrEqual(data.numberDomain.max);
            }
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
                expect(data.proposal.proposedAnswer).toBeGreaterThan(0);
                expect(data.proposal.roundedProposedAnswer).toBeGreaterThan(0);
            }
        }
    );

    it('retains 23 + 32 + 45 = 100 when only the reasonable proposal class is feasible', () => {
        const random = vi.spyOn(rng, 'random')
            .mockReturnValueOnce(21.5 / 49).mockReturnValueOnce(30.5 / 49).mockReturnValueOnce(43.5 / 49)
            .mockReturnValueOnce(0.999);
        const data = generator.generate({operations: [Area.Addition, Area.Addition], range: {min: 0, max: 100}})!.data;
        expect(data.operands).toEqual([23, 32, 45]);
        expect(data.intermediate).toBe(55);
        expect(data.answer).toBe(100);
        expect(data.roundingPlace).toBe(100);
        expect(data.proposal).toEqual({proposedAnswer: 99, roundedProposedAnswer: 100});
        expect(random).toHaveBeenCalledTimes(4);
    });

    it('rejects an out-of-domain rounded result before consuming a proposal draw', () => {
        const random = vi.spyOn(rng, 'random')
            .mockReturnValueOnce(21.5 / 49).mockReturnValueOnce(30.5 / 49).mockReturnValueOnce(42.5 / 49);
        expect(generator.generate({operations: [Area.Addition, Area.Addition], range: {min: 0, max: 99}})).toBeNull();
        expect(random).toHaveBeenCalledTimes(3);
    });

    it('preserves the current thousand-boundary multiplication case with a feasible proposal', () => {
        setSeed(749);
        const data = generator.generate({operations: [Area.Multiplication, Area.Multiplication],
            range: {min: 0, max: 1000}})!.data;
        expect(data.operands).toEqual([10, 10, 10]);
        expect(data.answer).toBe(1000);
        expect(data.roundingPlace).toBe(1000);
        expect(data.proposal.proposedAnswer).toBeGreaterThanOrEqual(500);
        expect(data.proposal.proposedAnswer).toBeLessThan(1000);
        expect(data.proposal.roundedProposedAnswer).toBe(1000);
    });

    it('retains the declared one-million capacity separately from the old operand-sampling cap', () => {
        setSeed(16);
        const data = generator.generate({operations: [Area.Addition, Area.Addition], range: {min: 0, max: Number.MAX_SAFE_INTEGER}})!.data;
        expect(data.numberDomain).toEqual({min: 1, max: 1_000_000});
        for (const value of [...data.operands, data.intermediate, data.answer]) expect(value).toBeLessThanOrEqual(999_999);
        expect(data.proposal.proposedAnswer).toBeLessThanOrEqual(1_000_000);
        expect(data.proposal.roundedProposedAnswer).toBeLessThanOrEqual(1_000_000);
    });

    it('validates configuration before generating evidence', () => {
        expect(() => generator.generate(null as never)).toThrow();
        expect(() => generator.generate({})).toThrow();
        expect(generator.generate({operations: [Area.Addition, Area.Addition], range: {min: 1_000_000, max: 999_999}})).toBeNull();
        expect(generator.generate({operations: 'unsupported', range: {min: 0, max: 1000}})).toBeNull();
        expect(generator.generate({operations: [Area.Addition, Area.Addition], range: {min: 50, max: 51}})).toBeNull();
    });

});
