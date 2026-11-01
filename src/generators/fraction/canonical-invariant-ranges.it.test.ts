import { afterEach, describe, expect, it, vi } from 'vitest';
import { Ability, Area, Scope } from 'edugraph-ts';
import * as rng from '../../lib/random.ts';
import { createCanonicalNumericRange, hasCanonicalRangeWitness } from '../../lib/canonical-numeric-range.ts';
import { planModelCompatibility } from '../../lib/model-compatibility.ts';
import { DecimalNotationGenerator } from './decimal-notation/generator.ts';
import { DecimalNotationGeneratorSchema, spec as notationSpec } from './decimal-notation/spec.ts';
import { DecimalComparisonGenerator } from '../number/decimal-comparison/generator.ts';
import { DecimalComparisonGeneratorSchema, spec as decimalComparisonSpec } from '../number/decimal-comparison/spec.ts';
import { FractionComparisonGenerator } from './fraction-comparison/generator.ts';
import { FractionComparisonGeneratorSchema, spec as fractionComparisonSpec } from './fraction-comparison/spec.ts';
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
        for (const [spec, schema, task] of [[notationSpec, DecimalNotationGeneratorSchema, []],
            [decimalComparisonSpec, DecimalComparisonGeneratorSchema, [Area.NumericEquality, Scope.Equal]],
            [fractionComparisonSpec, FractionComparisonGeneratorSchema, [Area.FractionCommonDenominatorComparison, Scope.CommonDenominator, Scope.Greater]],
            [benchmarkSpec, FractionBenchmarkArithmeticGeneratorSchema, [Area.Addition]]] as const) {
            expect(spec.generalLabels).toContain(Scope.NumbersSmaller5);
            expect(spec.generalLabels).not.toContain(Scope.NumbersLargerZero);
            const generator = { generatorId: spec.generatorId, generalLabels: spec.generalLabels, schema, spec };
            const view = { viewId: 'canonical-bound-proof', generalLabels: [Ability.ProcedureExecution], schema: {},
                spec: { viewId: 'canonical-bound-proof', generalLabels: [Ability.ProcedureExecution] } };
            expect(planModelCompatibility({ id: 'fraction-upper5', labels: [...task, Scope.NumbersSmaller5, Ability.ProcedureExecution] }, generator, view).supported, spec.generatorId).toBe(true);
        }
    });
    it('covers all99 notation representations, bounding values rather than storage coefficients', () => {
        const random = vi.spyOn(rng, 'random');
        const generator = new DecimalNotationGenerator();
        let count = 0;
        for (const denominator of [10, 100] as const) {
            const numerators = Array.from({ length: denominator - 1 }, (_, i) => i + 1).filter(n => denominator === 10 || n % 10 !== 0);
            for (const [index, numerator] of numerators.entries()) {
                random.mockReturnValueOnce(denominator === 10 ? 0.25 : 0.75).mockReturnValueOnce((index + 0.5) / numerators.length);
                const { data } = generator.generate({});
                expect(data.value).toMatchObject({ numerator, denominator });
                check([rational(data.value), data.sharedWhole]);
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
    it('covers every fraction-comparison family and boundary without treating notation parts as operands', () => {
        const random = vi.spyOn(rng, 'random');
        const generator = new FractionComparisonGenerator();
        const denominators = [2, 3, 4, 6, 8], common = [3, 4, 6, 8];
        let count = 0;
        const verify = (data: ReturnType<typeof generator.generate>['data']) => {
            check([rational(data.first), rational(data.second), data.sharedWhole,
                ...('benchmark' in data ? [rational(data.benchmark)] : [])]);
            count++;
        };
        for (const relation of [Scope.Greater, Scope.Less]) {
            for (const [dIndex, d] of common.entries())
                for (let first = 0; first < d - 1; first++)
                    for (let second = 0; second < d - 2; second++) {
                        random.mockReturnValueOnce((dIndex + 0.5) / common.length).mockReturnValueOnce((first + 0.5) / (d - 1)).mockReturnValueOnce((second + 0.5) / (d - 2));
                        verify(generator.generate({ comparisonMode: Area.FractionCommonDenominatorComparison, usesReferenceComparison: false,
                            usesCommonDenominator: true, usesCommonNumerator: false, relation }).data);
                    }
            for (let first = 0; first < 5; first++)
                for (let second = 0; second < 4; second++) {
                    const other = second >= first ? second + 1 : second, lowest = Math.min(denominators[first], denominators[other]);
                    for (let n = 1; n < lowest; n++) {
                        random.mockReturnValueOnce((first + 0.5) / 5).mockReturnValueOnce((second + 0.5) / 4).mockReturnValueOnce((n - 0.5) / (lowest - 1));
                        verify(generator.generate({ comparisonMode: Area.FractionCommonNumeratorComparison, usesReferenceComparison: false,
                            usesCommonDenominator: false, usesCommonNumerator: true, relation }).data);
                    }
                }
        }
        const proper = denominators.flatMap(d => Array.from({ length: d - 1 }, (_, i) => ({ numerator: i + 1, denominator: d })));
        for (const relation of [Scope.Greater, Scope.Equal, Scope.Less]) {
            const expected = proper.flatMap(first => proper.map(second => ({ first, second }))).filter(({ first: a, second: b }) => a.numerator !== b.numerator && a.denominator !== b.denominator && (relation === Scope.Equal
                ? a.denominator < b.denominator && 2 * a.numerator === a.denominator && 2 * b.numerator === b.denominator && a.denominator > 2
                : relation === Scope.Greater ? 2 * a.numerator > a.denominator && 2 * b.numerator < b.denominator
                    : 2 * a.numerator < a.denominator && 2 * b.numerator > b.denominator));
            for (const [index, pair] of expected.entries()) {
                random.mockReturnValueOnce((index + 0.5) / expected.length);
                const { data } = generator.generate({ comparisonMode: relation === Scope.Equal ? Area.NumericEquality : Area.NumericInequality,
                    usesReferenceComparison: true, usesCommonDenominator: false, usesCommonNumerator: false, relation });
                expect(data.first).toEqual(pair.first);
                expect(data.second).toEqual(pair.second);
                verify(data);
            }
        }
        expect(count).toBeGreaterThan(200);
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
