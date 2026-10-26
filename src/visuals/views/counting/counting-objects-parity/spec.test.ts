import {describe, expect, it} from 'vitest';
import {Ability, Area, Scope} from 'edugraph-ts';
import {CountingBasicGeneratorSchema, spec as generatorSpec} from '../../../../generators/counting/counting-basic/spec.ts';
import {matchTarget} from '../../../../lib/matching.ts';
import {resolvePlannedConfigurations} from '../../../../lib/planned-generation.ts';
import {extractSchemaLabels} from '../../../../lib/utils.ts';
import {CountingObjectsParityViewSchema, spec} from './spec.ts';

describe('counting-objects-parity capabilities', () => {
    it.each([Scope.EvenNumbers, Scope.OddNumbers])('preserves an existing %s target while annotating visible numerals', parity => {
        const target = {id: `parity-${parity.split('/').pop()}`, labels: [Area.NumerationWithIntegers,
            Scope.NumbersSmaller20, parity, Ability.ConceptClassification]};
        const matched = matchTarget(target, {
            generatorId: generatorSpec.generatorId, spec: generatorSpec, schema: CountingBasicGeneratorSchema,
            generalLabels: generatorSpec.generalLabels,
            labels: [...generatorSpec.generalLabels, ...extractSchemaLabels(CountingBasicGeneratorSchema)],
            problemType: 'CountingProblem'
        }, {
            viewId: spec.viewId, spec, schema: CountingObjectsParityViewSchema, generalLabels: spec.generalLabels,
            supportedLabels: [...spec.generalLabels], problemType: 'CountingProblem'
        });
        expect(matched.matched).toBe(true);
        if (!matched.matched) throw new Error('Existing parity target stopped matching.');
        const resolved = resolvePlannedConfigurations({generatorSchema: CountingBasicGeneratorSchema,
            viewSchema: CountingObjectsParityViewSchema, plan: matched.plan,
            sampleKey: `${target.id}#counting-basic#counting-objects-parity#train#question#inst:0`, attempt: 1, seed: 42});

        expect(matched.plan.targetLabels).toEqual([...target.labels].sort());
        expect(target.labels).not.toContain(Scope.ArabicNumerals);
        expect(resolved.labels).toEqual(expect.arrayContaining([...target.labels, Scope.ArabicNumerals,
            Scope.Base10, Scope.PhysicalNumbers]));
        expect(resolved.view.config).toEqual({});
    });
});
