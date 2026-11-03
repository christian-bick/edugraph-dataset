import {getTargetPolicyLabels} from '../../../../lib/compatibility.ts';
import {Ability, Area, Scope} from 'edugraph-ts';
import {planCompatibility} from '../../../../lib/compatibility.ts';
import {normalizeSchemaChoices} from '../../../../lib/schema-choices.ts';
import {FractionEquivalenceGeneratorSchema, spec as generatorSpec} from '../../../../generators/fraction/fraction-equivalence/spec.ts';
import {describe, expect, it} from 'vitest';
import {spec} from './spec.ts';

describe('FractionsEquivalenceModelViewSpec', () => {
    it('owns visual numbers in one shared frame for legacy and scaling models', () => {
        expect(spec.generalLabels).toEqual([
        Scope.VisualNumbers,
        Scope.SingleFrameOfReference,
        Ability.ConceptClassification,
        Scope.ArabicNumerals,
        Scope.Base10,
        Scope.NumbersWithoutZero
    ]);
        expect(getTargetPolicyLabels(spec.compatibility, 'reject')).toEqual([]);
    });
});

describe('equivalence classification evidence boundary', () => {
    it.each([[], [Area.Multiplication], [Area.ProportionalScaling], [Area.Multiplication, Area.ProportionalScaling]].map(areas => [areas] as const))(
        'preserves count classification only for supported claim bundle %j', areas => {
            for (const range of [Scope.NumbersSmaller5, Scope.NumbersSmaller10]) {
                const targetLabels = [...areas, range];
                const plan = planCompatibility({identity: {targetId: 'classification-evidence', generatorId: generatorSpec.generatorId, viewId: spec.viewId},
                    targetLabels, generatorLabels: generatorSpec.generalLabels, viewLabels: spec.generalLabels,
                    fields: normalizeSchemaChoices(FractionEquivalenceGeneratorSchema, targetLabels, 'generator'),
                    viewRules: spec.compatibility});
                expect(plan.supported).toBe(areas.length === 0);
            }
        });
});
