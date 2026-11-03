import {Ability, Area, Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {createCanonicalNumericRange} from '../../../lib/canonical-numeric-range.ts';
import {getRandomState, setSeed} from '../../../lib/random.ts';
import {resolveSchemaChoices} from '../../../lib/schema-choices.ts';
import {extractConfig, findSchemaFallbackContractIssues, generateWithLabels} from '../../../lib/utils.ts';
import {FractionScaleRelationsGenerator} from './generator.ts';
import {FractionScaleRelationsGeneratorSchema as schema, spec} from './spec.ts';

const profiles = [
    ['greater', [Area.NumericInequality, Scope.Greater, Scope.ImproperFractions]],
    ['less', [Area.NumericInequality, Scope.Less, Scope.ProperFractions]],
    ['equal', [Area.NumericEquality, Scope.Equal, Scope.ImproperFractions]]
] as const;

describe('fraction scale relation capabilities', () => {
    it('owns scaling and multiplication while the comparison view owns the learner action', () => {
        expect(spec.generalLabels).toEqual([Area.ProportionalScaling, Area.Multiplication]);
        for (const ability of Object.values(Ability)) expect(spec.generalLabels).not.toContain(ability);
        expect(findSchemaFallbackContractIssues(schema)).toEqual([]);
    });

    it.each(profiles)('resolves all %s profile bands identically through direct and planned bindings', (comparisonProfile, profileLabels) => {
        for (const [label, upper] of [[Scope.NumbersSmaller5, 5], [Scope.NumbersSmaller10, 10],
            ...(comparisonProfile === 'greater' ? [[Scope.NumbersSmaller20, 20] as const] : [])] as const) {
            const labels = [...profileLabels, label];
            setSeed(19); const direct = extractConfig(schema, labels), state = getRandomState();
            expect(direct.config).toEqual({comparisonProfile, range: createCanonicalNumericRange(upper)});
            expect(new Set(direct.resolvedLabels)).toEqual(new Set(labels));
            setSeed(19);
            const planned = resolveSchemaChoices(schema, labels, {comparisonProfile: [...profileLabels], range: [label]});
            expect(planned.config).toEqual(direct.config);
            expect(new Set(planned.resolvedLabels)).toEqual(new Set(direct.resolvedLabels));
            expect(getRandomState()).toBe(state);
            const generated = generateWithLabels(new FractionScaleRelationsGenerator(), labels)!;
            expect(generated.data.relation).toBe(comparisonProfile);
            expect(generated.data).not.toHaveProperty('wholeNumberAnalogy');
            expect(new Set(generated.labels)).toEqual(new Set(labels));
        }
    });

    it('resolves every unqualified and upper-only request to a feasible native draw', () => {
        for (const labels of [[], [Scope.NumbersSmaller5], [Scope.NumbersSmaller10], [Scope.NumbersSmaller20]]) {
            for (let seed = 0; seed < 24; seed++) {
                setSeed(seed); const generated = generateWithLabels(new FractionScaleRelationsGenerator(), labels)!;
                const upper = generated.labels.includes(Scope.NumbersSmaller20) ? 20 : generated.labels.includes(Scope.NumbersSmaller10) ? 10 : 5;
                const max = Math.max(generated.data.reference.numerator, generated.data.scaleFactor.numerator,
                    generated.data.scaleFactor.denominator);
                expect(max).toBeLessThanOrEqual(upper);
                expect(max).toBeGreaterThan(upper === 20 ? 10 : upper === 10 ? 5 : -1);
                if (upper === 20) expect(generated.data.relation).toBe('greater');
            }
        }
    });

    it('rejects contradictory profiles and infeasible explicit bands', () => {
        expect(() => extractConfig(schema, [Area.NumericEquality, Scope.Greater])).toThrow();
        expect(() => extractConfig(schema, [...profiles[1][1], Scope.NumbersSmaller20])).toThrow();
        expect(() => extractConfig(schema, [...profiles[2][1], Scope.NumbersSmaller20])).toThrow();
    });
});
