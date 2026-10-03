import {Ability, Area, Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {extractConfig, generateWithLabels} from '../../../lib/utils.ts';
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
            expect(resolved.config).toEqual({comparisonProfile});
            expect(new Set(resolved.resolvedLabels)).toEqual(new Set<string>(selected));

            const generated = generateWithLabels(new FractionScalingGenerator(), labels)!;
            expect(generated.data.relation).toBe(comparisonProfile);
            expect(new Set(generated.labels)).toEqual(new Set<string>(selected));
        });

    it('rejects incompatible equality and strict-order requests', () => {
        expect(() => extractConfig(FractionScalingGeneratorSchema,
            [...invariant, Area.NumericEquality, Scope.Greater, Scope.FractionNumbers]))
            .toThrow();
    });
});
