import {afterEach, describe, expect, it, vi} from 'vitest';
import {hasCanonicalRangeWitness, createCanonicalNumericRange} from '../../../lib/canonical-numeric-range.ts';
import * as rng from '../../../lib/random.ts';
import {factorMultipleRangeProfiles, factorPairNumbers, multipleTestCases} from './domain.ts';
import {FactorMultipleRelationsGenerator} from './generator.ts';

const generator = new FactorMultipleRelationsGenerator();
afterEach(() => vi.restoreAllMocks());

describe('complete factor and multiple domains', () => {
    it('preserves exactly all99 original numbers with complete factor proofs and one draw', () => {
        const draw = vi.spyOn(rng, 'random');
        const found: number[] = [];
        for (const {range} of factorMultipleRangeProfiles) {
            const numbers = factorPairNumbers(range);
            for (const [index, number] of numbers.entries()) {
                draw.mockReturnValue((index + 0.5) / numbers.length);
                const data = generator.generate({task: 'factor-pairs', range}).data;
                if (data.kind !== 'factor-pairs') throw new Error('Expected a factor proof.');
                expect(data.number).toBe(number);
                expect(data.factors).toEqual(Array.from({length: number}, (_, index) => index + 1)
                    .filter(factor => number % factor === 0));
                expect(hasCanonicalRangeWitness([number, data.factorCount, ...data.factors], range)).toBe(true);
                found.push(number);
            }
        }
        expect(found).toEqual(Array.from({length: 99}, (_, index) => index + 1));
        expect(draw).toHaveBeenCalledTimes(99);
    });

    it('preserves every old divisor/quotient case and its conditional probability without forcing balance', () => {
        const draw = vi.spyOn(rng, 'random');
        const found = new Set<string>();
        let originalMass = 0;
        for (const {range} of factorMultipleRangeProfiles) {
            const cases = multipleTestCases(range);
            const mass = cases.reduce((total, item) => total + item.weight, 0);
            let before = 0;
            for (const item of cases) {
                expect(item.weight).toBe(1 / (8 * Math.floor(99 / item.divisor)));
                draw.mockReturnValue((before + item.weight / 2) / mass);
                const data = generator.generate({task: 'one-digit-multiple-test', range}).data;
                expect(data).toEqual({kind: 'one-digit-multiple-test', divisor: item.divisor,
                    quotient: item.quotient, candidate: item.divisor * item.quotient, remainder: 0, isMultiple: true});
                expect(hasCanonicalRangeWitness([item.divisor, item.quotient, item.divisor * item.quotient], range)).toBe(true);
                const key = `${item.divisor}:${item.quotient}`;
                expect(found.has(key)).toBe(false);
                found.add(key);
                before += item.weight;
            }
            originalMass += mass;
        }
        const expected = Array.from({length: 8}, (_, index) => index + 2).flatMap(divisor =>
            Array.from({length: Math.floor(99 / divisor)}, (_, index) => `${divisor}:${index + 1}`));
        expect([...found].sort()).toEqual(expected.sort());
        expect(found.size).toBe(178);
        expect(originalMass).toBeCloseTo(1, 12);
        expect(draw).toHaveBeenCalledTimes(178);
    });

    it('rejects unproved bounds and factor-proof floors before consuming entropy', () => {
        const draw = vi.spyOn(rng, 'random');
        for (const range of [{min: 0, max: 100}, {...createCanonicalNumericRange(100), maximumAbove: 10},
            createCanonicalNumericRange(1000), createCanonicalNumericRange(100, 10)]) {
            for (const task of ['factor-pairs', 'one-digit-multiple-test'] as const)
                expect(() => generator.generate({task, range} as never)).toThrow(/supports the selected range/);
        }
        expect(() => generator.generate({task: 'factor-pairs', range: createCanonicalNumericRange(100, 5)})).toThrow();
        expect(draw).not.toHaveBeenCalled();
    });
});
