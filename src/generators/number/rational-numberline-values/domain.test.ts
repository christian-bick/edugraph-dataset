import {Area, Scope} from 'edugraph-ts';
import {afterEach, describe, expect, it, vi} from 'vitest';
import {createCanonicalNumericRange, hasCanonicalRangeWitness} from '../../../lib/canonical-numeric-range.ts';
import * as random from '../../../lib/random.ts';
import {extractConfig} from '../../../lib/utils.ts';
import {resolveSchemaChoices} from '../../../lib/schema-choices.ts';
import {normalizeSchemaChoices} from '../../../lib/schema-choices.ts';
import {rationalLineScales} from './domain.ts';
import {RationalNumberlineValuesGenerator} from './generator.ts';
import {RationalNumberlineValuesGeneratorSchema as schema} from './spec.ts';

afterEach(() => vi.restoreAllMocks());

describe('finite canonical numberline scales', () => {
    it('partitions all old scales and proves every exact tick/point in both sign domains', () => {
        const draw = vi.spyOn(random, 'random');
        const generator = new RationalNumberlineValuesGenerator();
        let cases = 0;
        for (const numberKind of ['integer', 'fraction', 'decimal'] as const) {
            const scaleKeys = new Set<string>();
            for (const upper of [5, 10, 20]) {
                const range = createCanonicalNumericRange(upper);
                const scales = rationalLineScales(numberKind, range);
                for (const [scaleIndex, {radius, stepNumerator}] of scales.entries()) {
                    const key = `${radius}/${stepNumerator}`;
                    expect(scaleKeys.has(key)).toBe(false);
                    scaleKeys.add(key);
                    const denominators = numberKind === 'integer' ? [1] : numberKind === 'fraction' ? [2, 3, 4, 6, 8] : [2, 4, 10];
                    for (const [denominatorIndex, denominator] of denominators.entries())
                        for (const signDomain of ['signed', 'nonnegative'] as const)
                            for (let point = 0; point < (signDomain === 'signed' ? radius : radius + 1); point++)
                                for (const precision of [0, 1]) {
                                    const draws = [(scaleIndex + 0.5) / scales.length];
                                    if (numberKind !== 'integer') draws.push((denominatorIndex + 0.5) / denominators.length);
                                    draws.push((precision + 0.5) / 2, (point + 0.5) / (signDomain === 'signed' ? radius : radius + 1));
                                    draw.mockImplementation(() => {
                                        const value = draws.shift();
                                        if (value === undefined) throw new Error('Unexpected rational-line draw');
                                        return value;
                                    });
                                    const {data} = generator.generate({numberKind, signDomain, range});
                                    expect(draws).toEqual([]);
                                    expect(data.axis.step.numerator / data.axis.step.denominator).toBe(stepNumerator / denominator);
                                    const expectedTicks = Array.from({length: signDomain === 'signed' ? 2 * radius + 1 : radius + 1},
                                        (_, index) => (index - (signDomain === 'signed' ? radius : 0)) * stepNumerator / denominator);
                                    expect(data.axis.ticks.map(value => value.numerator / value.denominator)).toEqual(expectedTicks);
                                    expect(hasCanonicalRangeWitness([...expectedTicks, data.point.value.numerator / data.point.value.denominator], range)).toBe(true);
                                    cases++;
                                }
                }
            }
            expect(scaleKeys.size).toBe(numberKind === 'integer' ? 12 : 4);
        }
        expect(cases).toBe(704);
    });

    it('honors integer-only high bands through direct and planned resolution, including fallback contexts', () => {
        for (const [form, kind] of [[
            [Area.NumerationWithIntegers, Scope.IntegerNumbers], 'integer'
        ], [[Area.NumerationWithFractions, Scope.FractionNumbers, Scope.ProperFractions], 'fraction'],
        [[Area.NumerationWithDecimals, Scope.DecimalNumbers], 'decimal']] as const)
            for (const [bound, upper] of [[Scope.NumbersSmaller5, 5], [Scope.NumbersSmaller10, 10], [Scope.NumbersSmaller20, 20]] as const) {
                const labels = [...form, Scope.NumbersWithoutNegatives, bound];
                if (kind !== 'integer' && upper > 5) {
                    expect(() => extractConfig(schema, labels)).toThrow();
                    continue;
                }
                const direct = extractConfig(schema, labels);
                const planned = resolveSchemaChoices(schema, labels, {numberKind: form, signDomain: [Scope.NumbersWithoutNegatives], range: [bound]});
                expect(planned.config).toEqual(direct.config);
                expect(new Set(planned.resolvedLabels)).toEqual(new Set(direct.resolvedLabels));
                expect(direct.config).toEqual({numberKind: kind, signDomain: 'nonnegative', range: createCanonicalNumericRange(upper)});
            }
        for (let seed = 0; seed < 64; seed++) {
            random.setSeed(seed);
            expect(extractConfig(schema, [Scope.NumbersSmaller20]).config.numberKind).toBe('integer');
            expect(extractConfig(schema, [Area.NumerationWithDecimals, Scope.DecimalNumbers]).config.range!.max).toBe(5);
        }
    });

    it('rejects malformed ranges and has no fractional high-band scales', () => {
        expect(rationalLineScales('fraction', createCanonicalNumericRange(10))).toEqual([]);
        for (const range of [null, createCanonicalNumericRange(100), createCanonicalNumericRange(10, 5),
            {...createCanonicalNumericRange(5), maximumAbove: 0}, {...createCanonicalNumericRange(5), minimumBelow: 10}])
            expect(() => rationalLineScales('integer', range as never)).toThrow();
        expect(() => rationalLineScales('irrational' as never, createCanonicalNumericRange(5))).toThrow();
        expect(() => new RationalNumberlineValuesGenerator().generate({numberKind: 'fraction', signDomain: 'signed', range: createCanonicalNumericRange(10)})).toThrow(/no scale/);
    });

    it('uses only nonnegative fallback contexts while retaining explicit signed requests', () => {
        for (const bound of [Scope.NumbersSmaller5, Scope.NumbersSmaller10, Scope.NumbersSmaller20]) {
            const labels = [Area.NumerationWithIntegers, bound];
            const domain = normalizeSchemaChoices(schema, labels, 'generator').find(field => field.field === 'signDomain')!;
            expect(domain.alternatives.map(alternative => alternative.labels)).toEqual([[Scope.NumbersWithoutNegatives]]);
            for (let seed = 0; seed < 16; seed++) {
                random.setSeed(seed);
                expect(extractConfig(schema, labels).config.signDomain).toBe('nonnegative');
            }
            const signed = normalizeSchemaChoices(schema, [...labels, Scope.NumbersWithNegatives], 'generator')
                .find(field => field.field === 'signDomain')!;
            expect(signed.alternatives.map(alternative => alternative.labels)).toEqual([[Scope.NumbersWithNegatives]]);
            expect(extractConfig(schema, [...labels, Scope.NumbersWithNegatives]).config.signDomain).toBe('signed');
        }
    });
});
