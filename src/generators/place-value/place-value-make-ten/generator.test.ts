import {describe, expect, it, vi} from 'vitest';
import * as rng from '../../../lib/random.ts';
import {createCanonicalNumericRange, hasCanonicalRangeWitness} from '../../../lib/canonical-numeric-range.ts';
import {PlaceValueMakeTenGenerator} from './generator.ts';

const generator = new PlaceValueMakeTenGenerator();
describe('canonical make-ten complements', () => {
    it.each([
        [true, 0, [0, 10]], [false, 0, [1, 2, 3, 4, 6, 7, 8, 9]], [false, 5, [5]]
    ] as const)('retains every complement with zero=%s lower=%s', (requireZero, lower, expected) => {
        const range = createCanonicalNumericRange(10, lower), draw = vi.spyOn(rng, 'random'), seen: number[] = [];
        try {
            for (let index = 0; index < expected.length; index++) {
                draw.mockReset().mockReturnValue((index + 0.5) / expected.length);
                const {data} = generator.generate({requireZero, range});
                seen.push(data.givenNumber);
                expect(data.givenNumber + data.missingNumber).toBe(10);
                expect(hasCanonicalRangeWitness([data.givenNumber, data.missingNumber, data.target], range)).toBe(true);
                expect([data.givenNumber, data.missingNumber].includes(0)).toBe(requireZero);
                expect(draw).toHaveBeenCalledTimes(1);
            }
            expect(seen).toEqual(expected);
        } finally {draw.mockRestore();}
    });
    it('rejects impossible or malformed profiles without consuming a draw', () => {
        const draw = vi.spyOn(rng, 'random');
        try {
            expect(() => generator.generate({} as never)).toThrow();
            for (const range of [undefined, {min: 0, max: 10}, createCanonicalNumericRange(5),
                {...createCanonicalNumericRange(10), maximumAbove: 0}, createCanonicalNumericRange(20)]) {
                expect(() => generator.generate({requireZero: false, range} as never)).toThrow();
            }
            expect(() => generator.generate({requireZero: true, range: createCanonicalNumericRange(10, 5)})).toThrow();
            expect(draw).not.toHaveBeenCalled();
        } finally {draw.mockRestore();}
    });
});
