import {afterEach, describe, expect, it, vi} from 'vitest';
import * as rng from '../../../lib/random.ts';
import {GeneratorValidationError} from '../../../lib/errors.ts';
import {singlePowerCandidates, type NumericProfile} from '../numerical-power-expressions/numeric-profiles.ts';
import {isNumericalPowerExpressionSyntaxProblem} from '../numerical-power-syntax-helpers.ts';
import {NumericalPowerExpressionSyntaxGenerator} from './generator.ts';

afterEach(() => vi.restoreAllMocks());

describe('literal-power mathematical producer', () => {
    it.each([false, true])('preserves every weighted original base/exponent draw, positive=%s', positive => {
        const generator = new NumericalPowerExpressionSyntaxGenerator();
        const random = vi.spyOn(rng, 'random');
        for (const numericProfile of [1, 2, 3, 4] as NumericProfile[]) {
            const candidates = singlePowerCandidates(positive, numericProfile);
            const total = candidates.reduce((sum, candidate) => sum + candidate.weight, 0);
            let offset = 0;
            for (const candidate of candidates) {
                random.mockReturnValue((offset + candidate.weight / 2) / total);
                const stub = generator.generate({exponents: positive ? 'positive' : 'allow-zero', numericProfile});
                expect(Object.keys(stub)).toEqual(['data']);
                expect(Object.keys(stub.data)).toEqual(['kind', 'expression']);
                expect(isNumericalPowerExpressionSyntaxProblem(stub.data)).toBe(true);
                expect(stub.data.expression.base.value).toEqual(candidate.base);
                expect(stub.data.expression.exponent).toBe(candidate.exponent);
                const values = [candidate.base.numerator / candidate.base.denominator, candidate.exponent];
                expect(values.some(value => value < 0)).toBe(numericProfile > 2);
                expect(values.some(value => value === 0)).toBe(numericProfile % 2 === 0);
                expect(Math.max(...values.map(Math.abs))).toBeLessThanOrEqual(5);
                expect(Math.min(...values.map(Math.abs))).toBeLessThan(5);
                offset += candidate.weight;
            }
        }
    });

    it('replays syntax and rejects incomplete and impossible configuration', () => {
        const generator = new NumericalPowerExpressionSyntaxGenerator();
        const config = {exponents: 'allow-zero', numericProfile: 3} as const;
        rng.setSeed(42); const first = generator.generate(config);
        rng.setSeed(42); expect(generator.generate(config)).toEqual(first);
        for (const value of [null, undefined, {}, {exponents: 'positive'}, {numericProfile: 1},
            {...config, exponents: 'negative'}, {...config, numericProfile: 0}, {...config, numericProfile: 5},
            {exponents: 'positive', numericProfile: 4}]) {
            expect(() => generator.generate(value as never)).toThrow(GeneratorValidationError);
        }
    });
});
