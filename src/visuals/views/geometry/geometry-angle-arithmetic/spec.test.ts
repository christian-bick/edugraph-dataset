import {Ability} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {extractConfig, extractSchemaLabels} from '../../../../lib/utils.ts';
import {GeometryAngleArithmeticViewSchema, spec} from './spec.ts';

describe('GeometryAngleArithmeticViewSchema', () => {
    it.each([
        Ability.ProcedureUnderstanding,
        Ability.ProcedureExecution,
        Ability.ProcedureInversion
    ])('resolves %s as the explicit task Ability', ability => {
        const {config, consumedLabels} = extractConfig(
            GeometryAngleArithmeticViewSchema,
            [ability]
        );

        expect(config.taskAbility).toBe(ability);
        expect(consumedLabels).toContain(ability);
    });

    it('owns all task Abilities as parameters rather than general claims', () => {
        expect(extractSchemaLabels(GeometryAngleArithmeticViewSchema)).toEqual([
            Ability.ProcedureUnderstanding,
            Ability.ProcedureExecution,
            Ability.ProcedureInversion
        ]);
        expect(spec.generalLabels).toEqual([]);
    });
});
