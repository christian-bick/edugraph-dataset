import {Ability, Area, Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {spec as gradeTwo} from '../../../../spec/ccss/grade-02.ts';
import {ArithmeticOpsPairsGeneratorSchema, spec as pairs} from '../../../../generators/arithmetic/arithmetic-ops-pairs/spec.ts';
import {enumerateDependencyAuditSelections} from '../../../../lib/label-dependency-audit.ts';
import {matchTarget} from '../../../../lib/matching.ts';
import {planModelCompatibility} from '../../../../lib/model-compatibility.ts';
import {getTargetPolicyLabels} from '../../../../lib/target-policies.ts';
import {extractSchemaLabels} from '../../../../types/schema.ts';
import {OperationsEqualAddendsEquationViewSchema as schema, spec} from './spec.ts';

const consumer = {viewId: spec.viewId, generalLabels: spec.generalLabels, supportedLabels: [...spec.generalLabels],
    schema, spec, problemType: 'ArithmeticPairProblem'};
const generator = {generatorId: pairs.generatorId, generalLabels: pairs.generalLabels,
    labels: [...pairs.generalLabels, ...extractSchemaLabels(ArithmeticOpsPairsGeneratorSchema)],
    schema: ArithmeticOpsPairsGeneratorSchema, spec: pairs, problemType: 'ArithmeticPairProblem'};
const domain = [Scope.IntegerNumbers, Scope.TwoOperands, Scope.EvenNumbers, Area.Addition, Area.IteratedOperation];

describe('equal-addends equation writing contract', () => {
    it('owns actual equation construction without adding execution or inversion', () => {
        expect(spec.generalLabels).toEqual([Scope.ArabicNumerals, Ability.Formalization,
            Area.Equation, Scope.ExpressionOnOneSide]);
        expect(schema).toEqual({});
        expect(getTargetPolicyLabels(spec.compatibility, 'require')).toEqual([Ability.Formalization]);
        expect(getTargetPolicyLabels(spec.compatibility, 'reject')).toEqual([]);
    });

    it.each([
        ['88f610cb', 2], ['a15286b6', 2], ['b9f35014', 1]
    ] as const)('preserves the complete real Grade2 target %s and its %s mathematical selections', (suffix, count) => {
        const target = gradeTwo.find(target => target.id === `2.OA.C.3-even-equal-addends~${suffix}`)!;
        expect(target).toBeDefined();
        const result = matchTarget(target, generator, consumer);
        expect(result.matched).toBe(true);
        if (!result.matched) throw new Error(result.reason);
        const enumeration = enumerateDependencyAuditSelections(result.plan);
        expect(enumeration.status).toBe('complete');
        expect(enumeration.selections).toHaveLength(count);
        for (const selection of enumeration.selections) {
            for (const label of [...domain, ...spec.generalLabels]) expect(selection.labels).toContain(label);
        }
    });

    it.each(domain)('rejects a producer missing the selected mathematical guarantee %s', missing => {
        const labels = domain.filter(label => label !== missing);
        expect(planModelCompatibility({id: 'writer', labels: [Ability.Formalization]},
            {generatorId: 'fixed-pair', generalLabels: labels, schema: {},
                spec: {generatorId: 'fixed-pair', generalLabels: labels}}, consumer).supported).toBe(false);
    });

    it('requires the stronger writing task and rejects a different nominal payload family', () => {
        const target = gradeTwo.find(target => target.id === '2.OA.C.3-even-equal-addends~b9f35014')!;
        expect(matchTarget({...target, labels: target.labels.filter(label => label !== Ability.Formalization)},
            generator, consumer).matched).toBe(false);
        expect(matchTarget(target, {...generator, problemType: 'ArithmeticTripleProblem'}, consumer))
            .toMatchObject({matched: false, reason: 'incompatible-type'});
    });
});
