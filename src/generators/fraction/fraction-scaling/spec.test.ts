import {Ability, Area, Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {extractConfig, findSchemaFallbackContractIssues, generateWithLabels} from '../../../lib/utils.ts';
import {createCanonicalNumericRange} from '../../../lib/canonical-numeric-range.ts';
import {getRandomState, setSeed} from '../../../lib/random.ts';
import {resolveSchemaChoices} from '../../../lib/schema-choices.ts';
import {FractionScalingGenerator} from './generator.ts';
import {FractionScalingGeneratorSchema, spec} from './spec.ts';

const invariant = [Area.ProportionalScaling, Area.Multiplication];
const cases = [
    ['5.NF.B.5a greater', [Area.NumericInequality, Scope.Greater, Scope.FractionNumbers],
        'greater', [Area.NumericInequality, Scope.Greater, Scope.ImproperFractions]],
    ['5.NF.B.5a less', [Area.NumericInequality, Scope.Less, Scope.FractionNumbers],
        'less', [Area.NumericInequality, Scope.Less, Scope.ProperFractions]],
    ['5.NF.B.5a equal', [Area.NumericEquality, Scope.Equal, Scope.FractionNumbers],
        'equal', [Area.NumericEquality, Scope.Equal, Scope.ImproperFractions]],
    ['5.NF.B.5b greater explanation', [Area.NumericInequality, Scope.Greater,
        Scope.ImproperFractions], 'greater',
    [Area.NumericInequality, Scope.Greater, Scope.ImproperFractions]],
    ['5.NF.B.5b less explanation', [Area.NumericInequality, Scope.Less,
        Scope.ProperFractions], 'less',
    [Area.NumericInequality, Scope.Less, Scope.ProperFractions]]
] as const;

describe('fraction-scaling schema integration', () => {
    it('owns invariant scaling math while views own Abilities', () => {
        expect(spec.generalLabels).toEqual(invariant);
        for (const ability of Object.values(Ability)) {
            expect(spec.generalLabels).not.toContain(ability);
        }
    });

    it.each(cases)('resolves %s to its correlated mathematical profile',
        (_target, requested, comparisonProfile, selected) => {
            const labels = [...invariant, ...requested, Ability.Interpretation];
            const resolved = extractConfig(FractionScalingGeneratorSchema, labels);
            const upper = resolved.config.range!.max;
            const expectedLabels = [...selected, Scope[`NumbersSmaller${upper}` as keyof typeof Scope]];
            expect(resolved.config).toEqual({comparisonProfile, range: createCanonicalNumericRange(upper)});
            expect(new Set(resolved.resolvedLabels)).toEqual(new Set<string>(expectedLabels));

            setSeed(17);
            const generated = generateWithLabels(new FractionScalingGenerator(), labels)!;
            expect(generated.data.relation).toBe(comparisonProfile);
            expect(generated.labels).toEqual(expect.arrayContaining([...selected]));
        });

    it('rejects incompatible equality and strict-order requests', () => {
        expect(() => extractConfig(FractionScalingGeneratorSchema,
            [...invariant, Area.NumericEquality, Scope.Greater, Scope.FractionNumbers]))
            .toThrow();
        expect(() => extractConfig(FractionScalingGeneratorSchema,
            [...invariant, Area.NumericInequality, Scope.Less, Scope.ProperFractions, Scope.NumbersSmaller20])).toThrow();
    });

    it('resolves standalone fallbacks and every complete profile/range binding before generation', () => {
        expect(findSchemaFallbackContractIssues(FractionScalingGeneratorSchema)).toEqual([]);
        for (const [, , comparisonProfile, selected] of cases) {
            for (const [label, upper] of [[Scope.NumbersSmaller5, 5], [Scope.NumbersSmaller10, 10],
                ...(comparisonProfile === 'greater' ? [[Scope.NumbersSmaller20, 20] as const] : [])] as const) {
                const requested = [...selected, label];
                setSeed(29); const direct = extractConfig(FractionScalingGeneratorSchema, requested), state = getRandomState();
                expect(direct.config).toEqual({comparisonProfile, range: createCanonicalNumericRange(upper)});
                setSeed(29);
                const planned = resolveSchemaChoices(FractionScalingGeneratorSchema, requested,
                    {comparisonProfile: [...selected], range: [label]});
                expect(planned.config).toEqual(direct.config);
                expect(new Set(planned.resolvedLabels)).toEqual(new Set(direct.resolvedLabels));
                expect(getRandomState()).toBe(state);
            }
        }
    });

    it('keeps unqualified and upper-only direct resolution feasible for every seeded choice', () => {
        for (const labels of [[], [Scope.NumbersSmaller5], [Scope.NumbersSmaller10], [Scope.NumbersSmaller20]]) {
            for (let seed = 0; seed < 24; seed++) {
                setSeed(seed); const generated = generateWithLabels(new FractionScalingGenerator(), labels)!;
                const upper = generated.labels.includes(Scope.NumbersSmaller20) ? 20 : generated.labels.includes(Scope.NumbersSmaller10) ? 10 : 5;
                expect(Math.max(generated.data.reference.numerator * 2, generated.data.scaleFactor.numerator,
                    generated.data.scaleFactor.denominator)).toBeLessThanOrEqual(upper);
                expect(Math.max(generated.data.reference.numerator * 2, generated.data.scaleFactor.numerator,
                    generated.data.scaleFactor.denominator)).toBeGreaterThan(upper === 20 ? 10 : upper === 10 ? 5 : -1);
            }
        }
    });
});
