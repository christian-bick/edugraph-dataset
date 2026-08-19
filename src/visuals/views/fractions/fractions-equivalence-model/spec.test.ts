import {Ability, Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {extractConfig} from '../../../../lib/utils.ts';
import {FractionsEquivalenceModelViewSchema, spec} from './spec.ts';

describe('FractionsEquivalenceModelViewSpec', () => {
    it('owns visual numbers in one shared frame for legacy and scaling models', () => {
        expect(spec.generalLabels).toEqual([
            Scope.VisualNumbers,
            Scope.SingleFrameOfReference
        ]);
    });

    it.each([
        [[Ability.ConceptClassification]],
        [[Ability.Formalization]],
        [[Ability.Formalization, Ability.ProcedureUnderstanding]]
    ])('owns the exact task Ability set %j', taskAbilities => {
        expect(extractConfig(
            FractionsEquivalenceModelViewSchema,
            taskAbilities
        ).config.taskAbilities).toEqual(taskAbilities);
    });
});
