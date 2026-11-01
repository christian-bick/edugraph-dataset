import {describe, expect, it, vi} from 'vitest';
import {setSeed} from '../../../lib/random.ts';
import * as rng from '../../../lib/random.ts';
import {createCanonicalNumericRange, hasCanonicalRangeWitness} from '../../../lib/canonical-numeric-range.ts';
import {IntegerAdditionCountingOnGenerator} from './generator.ts';

describe('IntegerAdditionCountingOnGenerator', () => {
    const generator = new IntegerAdditionCountingOnGenerator();

    it('generates complete, consistent integer-addition-counting-on evidence', () => {
        for (let seed = 0; seed < 50; seed++) {
            setSeed(seed);
            const data = generator.generate({range: createCanonicalNumericRange(20)}).data;
            expect(data.strategy).toBe('addition-counting-on');
            expect(data.operation).toBe('addition');
            expect(data.answer).toBe(data.leftOperand + data.rightOperand);
            expect(data.steps).toEqual(Array.from({length: data.rightOperand}, (_, index) => ({
                kind: 'operation', operation: 'addition',
                leftOperand: data.leftOperand + index, rightOperand: 1,
                result: data.leftOperand + (index + 1)
            })));
        }
    });

    it('is deterministic for a seed and configuration', () => {
        setSeed('integer-addition-counting-on');
        const first = generator.generate({range: createCanonicalNumericRange(20)});
        setSeed('integer-addition-counting-on');
        expect(generator.generate({range: createCanonicalNumericRange(20)})).toEqual(first);
    });

    it('validates configuration before generating evidence', () => {
        expect(() => generator.generate(null as never)).toThrow();
        expect(() => generator.generate({})).toThrow();
        expect(() => generator.generate({range: {min: 5, max: 4}} as never)).toThrow();
        expect(() => generator.generate({range: {min: 0, max: NaN}} as never)).toThrow();
        expect(() => generator.generate({range: createCanonicalNumericRange(10, 5)})).toThrow();
    });

    it.each([[5, 9], [10, 15], [20, 30]])('preserves complete addition support and inclusive endpoint at upper%s', (upper, count) => {
        const range = createCanonicalNumericRange(upper);
        const expected: number[][] = [];
        for (let left = 1; left <= upper; left++) for (let right = 1; right <= 3; right++) {
            if (left + right <= upper && left + right > range.maximumAbove) expected.push([left, right, left + right]);
        }
        const draw = vi.spyOn(rng, 'random');
        const seen = new Set<string>();
        try {
            for (let index = 0; index < count; index++) {
                draw.mockClear().mockReturnValue((index + 0.5) / count);
                const {data} = generator.generate({range});
                expect(draw).toHaveBeenCalledTimes(1);
                expect(hasCanonicalRangeWitness([data.leftOperand, data.rightOperand, data.answer, 1], range)).toBe(true);
                expect(data.steps.at(-1)).toMatchObject({result: data.answer});
                seen.add([data.leftOperand, data.rightOperand, data.answer].join(','));
            }
            expect(seen).toEqual(new Set(expected.map(tuple => tuple.join(','))));
            expect(seen.has([upper - 1, 1, upper].join(','))).toBe(true);
        } finally {
            draw.mockRestore();
        }
    });

});
