import {Ability, Area, Scope} from 'edugraph-ts';
import {afterEach, describe, expect, it, vi} from 'vitest';
import * as rng from '../../../lib/random.ts';
import {createCanonicalNumericRange} from '../../../lib/canonical-numeric-range.ts';
import {extractConfig, findSchemaFallbackContractIssues} from '../../../lib/utils.ts';
import {planCompatibility} from '../../../lib/compatibility.ts';
import {generatePlannedDraw} from '../../../lib/planned-generation.ts';
import {normalizeSchemaChoices} from '../../../lib/schema-choices.ts';
import {NumericalPowerExpressionsGenerator} from './generator.ts';
import {NumericalPowerExpressionsGeneratorSchema, spec} from './spec.ts';
import {spec as view, NumericalPowerExpressionEvaluateViewSchema as viewSchema} from '../../../visuals/views/operations/numerical-power-expression-evaluate/spec.ts';
import {numericProfileBundles, singlePowerCandidates, sampleSinglePowerCandidate, type NumericProfile} from './numeric-profiles.ts';
import {isPowerRange, powerRangeLabels, powerRanges, powerValuesFitRange, resolvePowerRange, singlePowerRangeCandidates} from './range-profile.ts';

afterEach(() => vi.restoreAllMocks());
const fraction = (n: number, d = 1) => ({numerator: n, denominator: d});

describe('power evaluation canonical bands', () => {
    it('compares exact mathematical magnitudes and rejects unsupported or weakened profiles', () => {
        expect(powerValuesFitRange([fraction(3), fraction(27)], createCanonicalNumericRange(100))).toBe(true);
        expect(powerValuesFitRange([fraction(300, 100), fraction(3)], createCanonicalNumericRange(5))).toBe(true);
        expect(powerValuesFitRange([fraction(10001, 1000), fraction(3)], createCanonicalNumericRange(20))).toBe(true);
        expect(powerValuesFitRange([fraction(10000, 1000), fraction(3)], createCanonicalNumericRange(20))).toBe(false);
        expect(powerValuesFitRange([fraction(100001, 1000), fraction(3)], createCanonicalNumericRange(100))).toBe(false);
        expect(powerValuesFitRange([], createCanonicalNumericRange(5))).toBe(false);
        expect(powerValuesFitRange([fraction(6)], createCanonicalNumericRange(10))).toBe(false);
        for (const value of [false, null, {}, createCanonicalNumericRange(1000), createCanonicalNumericRange(100, 5),
            {...createCanonicalNumericRange(20), maximumAbove: 5}]) expect(isPowerRange(value)).toBe(false);
        expect(resolvePowerRange([])).toBeUndefined();
        expect(resolvePowerRange([Scope.NumbersSmaller5, Scope.NumbersSmaller10])).toBeUndefined();
    });

    it.each([false, true])('partitions every original weighted single-power outcome exactly, positive=%s', positive => {
        const random = vi.spyOn(rng, 'random');
        const generator = new NumericalPowerExpressionsGenerator();
        for (const numericProfile of [1, 2, 3, 4] as NumericProfile[]) {
            const original = singlePowerCandidates(positive, numericProfile);
            const partition = powerRanges.flatMap(range => singlePowerRangeCandidates(positive, numericProfile, range));
            const key = (candidate: typeof original[number]) => JSON.stringify(candidate);
            expect(partition.map(key).sort()).toEqual(original.map(key).sort());
            for (const range of powerRanges) {
                const candidates = singlePowerRangeCandidates(positive, numericProfile, range);
                const total = candidates.reduce((sum, candidate) => sum + candidate.weight, 0);
                let offset = 0;
                for (const candidate of candidates) {
                    random.mockReturnValue((offset + candidate.weight / 2) / total);
                    const data = generator.generate({structure: 'single-power', exponents: positive ? 'positive' : 'allow-zero', numericProfile, range})!.data;
                    expect(data.expression.kind).toBe('power');
                    if (data.expression.kind !== 'power' || data.expression.base.kind !== 'number') throw new Error('Expected literal power.');
                    expect(data.expression.base.value).toEqual(candidate.base);
                    expect(data.expression.exponent).toBe(candidate.exponent);
                    const values = [...data.nodeValues.map(item => item.value.numerator / item.value.denominator), candidate.exponent];
                    expect(Math.max(...values.map(Math.abs))).toBeGreaterThan(range.maximumAbove);
                    expect(Math.max(...values.map(Math.abs))).toBeLessThanOrEqual(range.max);
                    expect(Math.min(...values.map(Math.abs))).toBeLessThan(5);
                    offset += candidate.weight;
                }
                if (!candidates.length) expect(() => generator.generate({structure: 'single-power', exponents: positive ? 'positive' : 'allow-zero', numericProfile, range})).toThrow();
            }
        }
        random.mockReturnValue(1);
        expect(sampleSinglePowerCandidate(originalPool())).toEqual(originalPool().at(-1));
    });

    it('resolves every admitted direct configuration and proves all mixed band/profile cells', () => {
        expect(findSchemaFallbackContractIssues(NumericalPowerExpressionsGeneratorSchema)).toEqual([]);
        const generator = new NumericalPowerExpressionsGenerator();
        for (const mixed of [false, true]) for (const positive of [false, true]) {
            for (const [profileIndex, numeric] of numericProfileBundles.entries()) for (const [rangeIndex, range] of powerRanges.entries()) {
                const numericProfile = (profileIndex + 1) as NumericProfile;
                const labels = [...numeric, powerRangeLabels[rangeIndex]!, ...(mixed ? [Area.OrderOfOperations] : []), ...(positive ? [Scope.PositiveExponent] : [])];
                const feasible = mixed || singlePowerRangeCandidates(positive, numericProfile, range).length > 0;
                const targetId = `power-cell-${mixed}-${positive}-${numericProfile}-${range.max}`;
                const targetLabels = [Area.ArithmeticExpression, Area.Exponentiation, Scope.IntegerExponent, Scope.RationalNumbers,
                    Scope.ArabicNumerals, Ability.ProcedureExecution, ...labels];
                const planned = planCompatibility({identity: {targetId, generatorId: spec.generatorId, viewId: view.viewId},
                    targetLabels, generatorLabels: spec.generalLabels, viewLabels: view.generalLabels,
                    generatorRules: spec.compatibility, viewRules: view.compatibility,
                    fields: [...normalizeSchemaChoices(NumericalPowerExpressionsGeneratorSchema, targetLabels, 'generator'),
                        ...normalizeSchemaChoices(viewSchema, targetLabels, 'view')]});
                expect(planned.supported).toBe(feasible);
                if (!feasible) {
                    expect(() => extractConfig(NumericalPowerExpressionsGeneratorSchema, labels)).toThrow();
                    continue;
                }
                const resolved = extractConfig(NumericalPowerExpressionsGeneratorSchema, labels).config;
                expect(resolved).toEqual({structure: mixed ? 'mixed-precedence' : 'single-power', exponents: positive ? 'positive' : 'allow-zero', numericProfile, range});
                const seed = range.max + profileIndex * 101 + (mixed ? 1000 : 0) + (positive ? 2000 : 0);
                rng.setSeed(seed);
                const data = generator.generate(resolved)!.data;
                if (!planned.supported) throw new Error(planned.reason);
                const draw = generatePlannedDraw({generator, viewSchema, plan: planned.plan,
                    sampleKey: `${targetId}#${spec.generatorId}#${view.viewId}#train#question#inst:0`, seed, attempt: 1});
                expect(draw.stub!.data).toEqual(data);
                const values = [...data.nodeValues.map(item => item.value.numerator / item.value.denominator), ...data.powerFacts.map(fact => fact.exponent),
                    ...data.powerFacts.flatMap(fact => fact.kind === 'positive-exponent' ? fact.cumulativeProducts.map(item => item.numerator / item.denominator) : [])];
                expect(Math.max(...values.map(Math.abs))).toBeGreaterThan(range.maximumAbove);
                expect(Math.max(...values.map(Math.abs))).toBeLessThanOrEqual(range.max);
                expect(Math.min(...values.map(Math.abs))).toBeLessThan(5);
                expect(values.some(value => value < 0)).toBe(numericProfile > 2);
                expect(values.some(value => value === 0)).toBe(numericProfile % 2 === 0);
            }
        }
    });
});

const originalPool = () => singlePowerCandidates(false, 1);
