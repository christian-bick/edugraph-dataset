import { afterEach, describe, expect, it, vi } from 'vitest';
import { Ability, Area, Scope } from 'edugraph-ts';
import * as rng from '../../lib/random.ts';
import { createCanonicalNumericRange, hasCanonicalRangeWitness } from '../../lib/canonical-numeric-range.ts';
import { planModelCompatibility } from '../../lib/model-compatibility.ts';
import { DecimalNotationGenerator } from './decimal-notation/generator.ts';
import { DecimalComparisonGenerator } from '../number/decimal-comparison/generator.ts';
import { DecimalComparisonGeneratorSchema, spec as decimalComparisonSpec } from '../number/decimal-comparison/spec.ts';
import { FractionBenchmarkArithmeticGenerator } from './fraction-benchmark-arithmetic/generator.ts';
import { FractionBenchmarkArithmeticGeneratorSchema, spec as benchmarkSpec } from './fraction-benchmark-arithmetic/spec.ts';
afterEach(() => vi.restoreAllMocks());
const range = createCanonicalNumericRange(5);
const rational = (value: {
    numerator: number;
    denominator: number;
}) => value.numerator / value.denominator;
const check = (values: number[]) => expect(hasCanonicalRangeWitness(values, range)).toBe(true);
describe('invariant canonical ranges for bounded fractional values', () => {
    it('provides a matching-capable upper5 without a new configuration choice', () => {
        for (const [spec, schema, task] of [[decimalComparisonSpec, DecimalComparisonGeneratorSchema, [Area.NumericEquality, Scope.Equal]],
            [benchmarkSpec, FractionBenchmarkArithmeticGeneratorSchema, [Area.Addition]]] as const) {
            expect(spec.generalLabels).toContain(Scope.NumbersSmaller5);
            expect(spec.generalLabels).not.toContain(Scope.NumbersLargerZero);
            const generator = { generatorId: spec.generatorId, generalLabels: spec.generalLabels, schema, spec };
            const view = { viewId: 'canonical-bound-proof', generalLabels: [Ability.ProcedureExecution], schema: {},
                spec: { viewId: 'canonical-bound-proof', generalLabels: [Ability.ProcedureExecution] } };
            expect(planModelCompatibility({ id: 'fraction-upper5', labels: [...task, Scope.NumbersSmaller5, Ability.ProcedureExecution] }, generator, view).supported, spec.generatorId).toBe(true);
        }
    });
    it('covers all99 notation representations with their assessed fraction part counts', () => {
        const random = vi.spyOn(rng, 'random');
        const generator = new DecimalNotationGenerator();
        let count = 0;
        for (const denominator of [10, 100] as const) {
            const numerators = Array.from({ length: denominator - 1 }, (_, i) => i + 1).filter(n => denominator === 10 || n % 10 !== 0);
            for (const [index, numerator] of numerators.entries()) {
                random.mockReturnValueOnce(denominator === 10 ? 0.25 : 0.75).mockReturnValueOnce((index + 0.5) / numerators.length);
                const profile = createCanonicalNumericRange(denominator);
                const { data } = generator.generate({range: profile});
                expect(data.value).toMatchObject({ numerator, denominator });
                expect(hasCanonicalRangeWitness([rational(data.value), data.sharedWhole, numerator, denominator], profile)).toBe(true);
                count++;
            }
        }
        expect(count).toBe(99);
        expect(random).toHaveBeenCalledTimes(198);
    });
    it('covers every decimal-comparison pair, including both equality precisions', () => {
        const random = vi.spyOn(rng, 'random');
        const generator = new DecimalComparisonGenerator();
        const tenths = Array.from({ length: 9 }, (_, i) => (i + 1) * 10), hundredths = Array.from({ length: 99 }, (_, i) => i + 1).filter(n => n % 10 !== 0);
        const pairs = tenths.flatMap(t => hundredths.flatMap(h => [[t, h], [h, t]]));
        let count = 0;
        for (const relation of ['greater', 'less'] as const) {
            const expected = pairs.filter(([a, b]) => relation === 'greater' ? a > b : a < b);
            for (const [index, pair] of expected.entries()) {
                random.mockReturnValueOnce((index + 0.5) / expected.length);
                const { data } = generator.generate({ comparisonKind: 'inequality', relation });
                expect([data.left.normalizedHundredths, data.right.normalizedHundredths]).toEqual(pair);
                check([data.left.normalizedHundredths / 100, data.right.normalizedHundredths / 100, data.sharedWhole]);
                count++;
            }
        }
        for (let index = 0; index < 9; index++)
            for (const orientation of [0.25, 0.75]) {
                random.mockReturnValueOnce((index + 0.5) / 9).mockReturnValueOnce(orientation);
                const { data } = generator.generate({ comparisonKind: 'equality', relation: 'equal' });
                check([data.left.normalizedHundredths / 100, data.right.normalizedHundredths / 100, data.sharedWhole]);
                count++;
            }
        expect(count).toBe(1638);
    });
    it('covers every finite benchmark pair, approximation mode and proposal branch', () => {
        const random = vi.spyOn(rng, 'random');
        const generator = new FractionBenchmarkArithmeticGenerator();
        const gcd = (a: number, b: number): number => b === 0 ? a : gcd(b, a % b);
        const operands = [2, 3, 4, 5, 6, 8, 10, 12].flatMap(d => Array.from({ length: d - 1 }, (_, i) => i + 1).filter(n => gcd(n, d) === 1)
            .map(n => ({ numerator: n, denominator: d, low: Math.floor(4 * n / d), high: Math.ceil(4 * n / d) })));
        let count = 0;
        for (const operation of ['addition', 'subtraction'] as const) {
            const pairs = operands.flatMap(a => operands.map(b => ({ a, b }))).filter(({ a, b }) => (a.low !== a.high || b.low !== b.high)
                && (operation === 'addition' || a.numerator * b.denominator >= b.numerator * a.denominator && a.low >= b.high));
            for (const approximationModel of ['bounds-only', 'nearest-quarter'] as const)
                for (const [index, pair] of pairs.entries()) {
                    for (const proposal of [0.25, 0.75])
                        for (const direction of [0.25, 0.75]) {
                            random.mockReturnValueOnce((index + 0.5) / pairs.length).mockReturnValueOnce(proposal).mockReturnValueOnce(direction);
                            const { data } = generator.generate({ operation, approximationModel });
                            // Some candidate branches do not need a direction draw.
                            random.mockReset();
                            expect(data.first.value).toEqual({ numerator: pair.a.numerator, denominator: pair.a.denominator });
                            check([rational(data.first.value), rational(data.second.value), rational(data.exactResult),
                                rational(data.resultBounds.lower), rational(data.resultBounds.upper), rational(data.candidate.value), data.sharedWhole,
                                ...(data.approximation ? [rational(data.approximation.estimatedResult)] : [])]);
                            count++;
                        }
                }
        }
        expect(count).toBeGreaterThan(4000);
    });
});
