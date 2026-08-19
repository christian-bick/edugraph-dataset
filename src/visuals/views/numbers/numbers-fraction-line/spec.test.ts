import {Ability, Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {extractConfig} from '../../../../lib/utils.ts';
import {spec, NumbersFractionLineViewSchema} from './spec.ts';

describe('NumbersFractionLineViewSchema', () => {
    it('owns one shared frame and resolves the requested task Abilities', () => {
        expect(spec.generalLabels).toEqual([
            Scope.Numberline,
            Scope.SingleFrameOfReference
        ]);
        expect(extractConfig(NumbersFractionLineViewSchema, []).config).toEqual({
            taskAbilities: []
        });
        for (const taskAbilities of [
            [Ability.VisualArticulation],
            [Ability.ConceptClassification],
            [Ability.Formalization],
            [Ability.Formalization, Ability.ProcedureUnderstanding]
        ]) {
            expect(extractConfig(
                NumbersFractionLineViewSchema,
                taskAbilities
            ).config.taskAbilities).toEqual(taskAbilities);
        }
    });
});
