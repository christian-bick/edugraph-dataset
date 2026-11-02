import {afterEach, describe, expect, it, vi} from 'vitest';
import {Area} from 'edugraph-ts';
import {createCanonicalNumericRange} from '../../../lib/canonical-numeric-range.ts';
import type {CanonicalNumericRange} from '../../../lib/canonical-numeric-range.ts';
import type {TwoStepOperationLabels} from '../helpers.ts';
import {roundingDomain, type RoundingCore} from './domain.ts';
import {operationNames} from '../helpers.ts';
import {setSeed} from '../../../lib/random.ts';
import * as rng from '../../../lib/random.ts';
import {ArithmeticWordProblemsRoundingGenerator} from './generator.ts';

afterEach(() => vi.restoreAllMocks());

function forceCore(operations: TwoStepOperationLabels, range: CanonicalNumericRange, selects: (row: RoundingCore) => boolean) {
    const names = [operationNames[operations[0]], operationNames[operations[1]]] as const;
    const domain = roundingDomain(names, range);
    const index = domain.rows.findIndex(selects);
    if (index < 0 || domain.cumulative[index] === (domain.cumulative[index - 1] ?? 0)) throw Error('Missing retained mathematical frame');
    const inputs = [((domain.cumulative[index - 1] ?? 0) + domain.cumulative[index]!) / 2 / domain.weight, (2 ** 32 - 1) / 2 ** 32];
    return vi.spyOn(rng, 'random').mockImplementation(() => inputs.shift()!);
}


describe('ArithmeticWordProblemsRoundingGenerator', () => {
    const generator = new ArithmeticWordProblemsRoundingGenerator();

    it('generates complete, consistent arithmetic-word-problems-rounding evidence', () => {
        for (let seed = 0; seed < 50; seed++) {
            setSeed(seed);
            const data = generator.generate({operations: [Area.Addition, Area.Addition], range: createCanonicalNumericRange(1000)})!.data;
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
        const first = generator.generate({operations: [Area.Addition, Area.Addition], range: createCanonicalNumericRange(1000)});
        setSeed('arithmetic-word-problems-rounding');
        expect(generator.generate({operations: [Area.Addition, Area.Addition], range: createCanonicalNumericRange(1000)})).toEqual(first);
    });

    it.each([Area.Addition, Area.Subtraction, Area.Multiplication, Area.Division] as const)(
        'keeps rounded results positive for %s, including small subtraction answers', operation => {
            for (let seed = 0; seed < 100; seed++) {
                setSeed(seed);
                const data = generator.generate({operations: [operation, operation], range: createCanonicalNumericRange(1000)})!.data;
                expect(data.roundedAnswer).toBeGreaterThan(0);
                expect(data.roundedAnswer).toBe(Math.round(data.answer / data.roundingPlace) * data.roundingPlace);
                expect(data.proposal.proposedAnswer).toBeGreaterThan(0);
                expect(data.proposal.roundedProposedAnswer).toBeGreaterThan(0);
            }
        }
    );

    it('retains 23 + 32 + 45 = 100 when only the reasonable proposal class is feasible', () => {
        const range = createCanonicalNumericRange(100, 20);
        const random = forceCore([Area.Addition, Area.Addition], range, r => r.a === 23 && r.b === 32 && r.c === 45);
        const data = generator.generate({operations: [Area.Addition, Area.Addition], range})!.data;
        expect(data.operands).toEqual([23, 32, 45]);
        expect(data.intermediate).toBe(55);
        expect(data.answer).toBe(100);
        expect(data.roundingPlace).toBe(100);
        expect(data.proposal).toEqual({proposedAnswer: 99, roundedProposedAnswer: 100});
        expect(random).toHaveBeenCalledTimes(2);
    });

    it('rejects noncanonical bounds before consuming a proposal draw', () => {
        const random = vi.spyOn(rng, 'random');
        expect(() => generator.generate({operations: [Area.Addition, Area.Addition], range: {min: 0, max: 99} as never})).toThrow();
        expect(random).not.toHaveBeenCalled();
    });

    it('preserves the current thousand-boundary multiplication case with a feasible proposal', () => {
        const range = createCanonicalNumericRange(1000, 10);
        forceCore([Area.Multiplication, Area.Multiplication], range, r => r.a === 10 && r.b === 10 && r.c === 10);
        const data = generator.generate({operations: [Area.Multiplication, Area.Multiplication], range})!.data;
        expect(data.operands).toEqual([10, 10, 10]);
        expect(data.answer).toBe(1000);
        expect(data.roundingPlace).toBe(1000);
        expect(data.proposal.proposedAnswer).toBeGreaterThanOrEqual(500);
        expect(data.proposal.proposedAnswer).toBeLessThan(1000);
        expect(data.proposal.roundedProposedAnswer).toBe(1000);
    });

    it('retains the declared one-million capacity separately from the old operand-sampling cap', () => {
        setSeed(16);
        const data = generator.generate({operations: [Area.Addition, Area.Addition], range: createCanonicalNumericRange(1000000)})!.data;
        expect(data.numberDomain).toEqual({min: 1, max: 1_000_000});
        for (const value of [...data.operands, data.intermediate, data.answer]) expect(value).toBeLessThanOrEqual(999_999);
        expect(data.proposal.proposedAnswer).toBeLessThanOrEqual(1_000_000);
        expect(data.proposal.roundedProposedAnswer).toBeLessThanOrEqual(1_000_000);
    });

    it('validates configuration before generating evidence', () => {
        expect(() => generator.generate(null as never)).toThrow();
        expect(() => generator.generate({})).toThrow();
        expect(() => generator.generate({operations: [Area.Addition, Area.Addition], range: {min: 1_000_000, max: 999_999} as never})).toThrow();
        expect(generator.generate({operations: 'unsupported', range: createCanonicalNumericRange(1000)})).toBeNull();
        expect(() => generator.generate({operations: [Area.Addition, Area.Addition], range: {min: 50, max: 51} as never})).toThrow();
    });

});
