import {describe, expect, it, vi} from 'vitest';
import * as rng from '../../../lib/random.ts';
import {createCanonicalNumericRange, hasCanonicalRangeWitness} from '../../../lib/canonical-numeric-range.ts';
import {ArithmeticDecomposeGenerator} from './generator.ts';

const generator = new ArithmeticDecomposeGenerator();
describe('canonical collection decomposition', () => {
    it.each([5, 10])('retains every supported pair/orientation for upper%s', upper => {
        const range = createCanonicalNumericRange(upper), minimum = upper === 5 ? 3 : 6;
        const draw = vi.spyOn(rng, 'random'), targets = new Set<number>();
        try {
            for (let total = minimum; total <= upper; total++) {
                const pairs = Array.from({length: Math.floor(total / 2)}, (_, index) => [index + 1, total - index - 1]);
                const choices = pairs.length === 1 ? [[0, 0]] : pairs.flatMap((_, first) =>
                    pairs.flatMap((__, second) => first === second ? [] : [[first, second]]));
                for (const [first, second] of choices) for (const flipFirst of [false, true]) for (const flipSecond of [false, true]) {
                    draw.mockReset().mockReturnValueOnce((total - minimum + 0.5) / (upper - minimum + 1));
                    if (pairs.length > 1) draw.mockReturnValueOnce((first + 0.5) / pairs.length)
                        .mockReturnValueOnce((second + 0.5) / pairs.length)
                        .mockReturnValueOnce(flipFirst ? 0.75 : 0.25).mockReturnValueOnce(flipSecond ? 0.75 : 0.25);
                    const {data} = generator.generate({range});
                    targets.add(data.targetNumber);
                    expect(data.targetNumber).toBe(total);
                    expect(data.pair1).toEqual(flipFirst && pairs.length > 1 ? [...pairs[first]].reverse() : pairs[first]);
                    expect(data.pair2).toEqual(pairs.length === 1 || flipSecond ? [...pairs[second]].reverse() : pairs[second]);
                    expect(data.pair1).not.toEqual(data.pair2);
                    expect(data.pair1[0] + data.pair1[1]).toBe(total);
                    expect(data.pair2[0] + data.pair2[1]).toBe(total);
                    expect(hasCanonicalRangeWitness([total, ...data.pair1, ...data.pair2], range)).toBe(true);
                }
            }
            expect([...targets]).toEqual(Array.from({length: upper - minimum + 1}, (_, index) => minimum + index));
        } finally {draw.mockRestore();}
    });
    it('is deterministic and rejects malformed or unsupported profiles before sampling', () => {
        rng.setSeed('canonical-decompose');
        const expected = generator.generate({range: createCanonicalNumericRange(10)});
        rng.setSeed('canonical-decompose');
        expect(generator.generate({range: createCanonicalNumericRange(10)})).toEqual(expected);
        const draw = vi.spyOn(rng, 'random');
        try {
            for (const range of [undefined, {min: 0, max: 10}, createCanonicalNumericRange(20),
                createCanonicalNumericRange(10, 5), {...createCanonicalNumericRange(10), maximumAbove: 0}]) {
                expect(() => generator.generate({range} as never)).toThrow();
            }
            expect(() => generator.generate({})).toThrow();
            expect(draw).not.toHaveBeenCalled();
        } finally {draw.mockRestore();}
    });
});
