import {Ability} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {extractConfig, extractSchemaLabels} from '../../../../lib/utils.ts';
import {ShapeSquareArrayViewSchema, spec} from './spec.ts';

describe('ShapeSquareArrayViewSchema', () => {
    it.each([
        Ability.Interpretation,
        Ability.VisualArticulation,
        Ability.ProcedureExecution,
        Ability.ProcedureInversion,
        Ability.ProcedureUnderstanding
    ])('resolves %s as the explicit task Ability', ability => {
        const {config, consumedLabels} = extractConfig(ShapeSquareArrayViewSchema, [ability]);

        expect(config.taskAbility).toBe(ability);
        expect(consumedLabels).toContain(ability);
    });

    it('owns all task Abilities as parameters rather than general claims', () => {
        const labels = extractSchemaLabels(ShapeSquareArrayViewSchema);

        expect(labels).toEqual(expect.arrayContaining([
            Ability.Interpretation,
            Ability.VisualArticulation,
            Ability.ProcedureExecution,
            Ability.ProcedureInversion,
            Ability.ProcedureUnderstanding
        ]));
        expect(spec.generalLabels).toEqual([]);
    });

    it('resolves textual reception independently from the task Ability', () => {
        const {config} = extractConfig(ShapeSquareArrayViewSchema, [
            Ability.ProcedureExecution,
            Ability.TextualReception
        ]);

        expect(config).toEqual({
            taskAbility: Ability.ProcedureExecution,
            useStory: true
        });
    });
});
