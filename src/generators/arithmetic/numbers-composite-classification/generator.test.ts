import {describe, expect, it, vi} from 'vitest';
import * as rng from '../../../lib/random.ts';
import {createCanonicalNumericRange, hasCanonicalRangeWitness} from '../../../lib/canonical-numeric-range.ts';
import {NumbersCompositeClassificationGenerator} from './generator.ts';
const generator = new NumbersCompositeClassificationGenerator();
const factors = (number: number) => Array.from({length: number}, (_, index) => index + 1).filter(value => number % value === 0);
const original = Array.from({length: 98}, (_, index) => index + 2).filter(number => factors(number).length > 2);
describe('canonical composite classification', () => {
    it('partitions every original classified number once across tight upper bands', () => {
        const draw = vi.spyOn(rng, 'random'), seen = new Set<number>();
        try {
            for (const upper of [5, 10, 20, 100]) {
                const range = createCanonicalNumericRange(upper);
                const candidates = original.filter(number => number <= upper && number > range.maximumAbove);
                expect(candidates.length).toBeGreaterThan(0);
                for (let index = 0; index < candidates.length; index++) {
                    draw.mockReset().mockReturnValue((index + 0.5) / candidates.length);
                    const {data} = generator.generate({range});
                    expect(data.number).toBe(candidates[index]);
                    expect(data.classification).toBe('composite');
                    expect(data.factors).toEqual(factors(data.number));
                    expect(data.factorCount).toBe(data.factors.length);
                    expect(data.factors).toContain(1);
                    expect(hasCanonicalRangeWitness([data.number, data.factorCount, ...data.factors], range)).toBe(true);
                    expect(draw).toHaveBeenCalledTimes(1);
                    expect(seen.has(data.number)).toBe(false);
                    seen.add(data.number);
                }
            }
            expect(seen).toEqual(new Set(original));
        } finally {draw.mockRestore();}
    });
    it('rejects missing, unsupported or malformed profiles before drawing', () => {
        const draw = vi.spyOn(rng, 'random');
        try {
            expect(() => generator.generate({})).toThrow();
            for (const range of [undefined, {min:0,max:100}, createCanonicalNumericRange(120),
                createCanonicalNumericRange(10,5), {...createCanonicalNumericRange(100),maximumAbove:10}]) {
                expect(() => generator.generate({range} as never)).toThrow();
            }
            expect(draw).not.toHaveBeenCalled();
        } finally {draw.mockRestore();}
    });
});
