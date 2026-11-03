import {Ability, Area, Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {extractConfig, findSchemaFallbackContractIssues, generateWithLabels} from '../../../lib/utils.ts';
import {getRandomState, setSeed} from '../../../lib/random.ts';
import {createCanonicalNumericRange} from '../../../lib/canonical-numeric-range.ts';
import {resolveSchemaChoices} from '../../../lib/schema-choices.ts';
import {FractionEquivalenceGenerator} from './generator.ts';
import {FractionEquivalenceGeneratorSchema as schema, spec} from './spec.ts';

describe('proper-fraction capability', () => {
    it('resolves both part-count bands for every mathematical claim combination before drawing', () => {
        expect(findSchemaFallbackContractIssues(schema)).toEqual([]);
        for (const usesMultiplication of [false, true]) for (const usesProportionalScaling of [false, true]) {
            const areas = [...(usesMultiplication ? [Area.Multiplication] : []), ...(usesProportionalScaling ? [Area.ProportionalScaling] : [])];
            for (const [rangeLabel, upper] of [[Scope.NumbersSmaller5, 5], [Scope.NumbersSmaller10, 10]] as const) {
                const requested = [...areas, rangeLabel];
                setSeed(19); const direct = extractConfig(schema, requested), state = getRandomState();
                expect(direct.config).toEqual({usesMultiplication, usesProportionalScaling, range: createCanonicalNumericRange(upper)});
                setSeed(19);
                const planned = resolveSchemaChoices(schema, requested, {usesMultiplication: usesMultiplication ? [Area.Multiplication] : [],
                    usesProportionalScaling: usesProportionalScaling ? [Area.ProportionalScaling] : [], range: [rangeLabel]});
                expect(planned.config).toEqual(direct.config);
                expect(new Set(planned.resolvedLabels)).toEqual(new Set(direct.resolvedLabels));
                expect(getRandomState()).toBe(state);
            }
            for (let seed = 0; seed < 24; seed++) {
                setSeed(seed);
                const generated = generateWithLabels(new FractionEquivalenceGenerator(), areas)!;
                const upper = generated.labels.includes(Scope.NumbersSmaller5) ? 5 : 10;
                expect(generated.data.second.denominator).toBeLessThanOrEqual(upper);
                expect(generated.data.second.denominator).toBeGreaterThan(upper === 5 ? -1 : 5);
            }
        }
    });
    it('guarantees proper equivalent fractions independently of requested labels', () => {
        expect(spec.generalLabels).toEqual(expect.arrayContaining([Area.FractionEquivalence, Scope.ProperFractions, Scope.EqualShares]));
        const cases: string[][] = [
            [],
            [Area.Multiplication],
            [Area.ProportionalScaling],
            [Area.Multiplication, Area.ProportionalScaling],
            [Ability.ConceptClassification]
        ];
        for (const labels of cases) {
            const result = generateWithLabels(new FractionEquivalenceGenerator(), labels)!;
            expect(result.data.task).toBe('relate-equivalent-fractions');
            expect(result.labels.includes(Area.Multiplication)).toBe(labels.includes(Area.Multiplication));
            expect(result.labels.includes(Area.ProportionalScaling)).toBe(labels.includes(Area.ProportionalScaling));
            expect(result.labels).not.toContain(Ability.ConceptClassification);
            expect(result.data.unitMultiplier).toEqual({
                numerator: result.data.scaleFactor,
                denominator: result.data.scaleFactor,
                value: 1
            });
        }
    });
    it('does not change the mathematical draw when the requested Ability changes', () => {
        const generator = new FractionEquivalenceGenerator();
        setSeed('same-relation');
        const first = generateWithLabels(generator, [Area.Multiplication, Area.ProportionalScaling, Ability.ConceptClassification]);
        setSeed('same-relation');
        expect(generateWithLabels(generator, [Area.Multiplication, Area.ProportionalScaling, Ability.Formalization])!.data).toEqual(first!.data);
    });
});
