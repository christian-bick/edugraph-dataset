import {Ability} from 'edugraph-ts';
import {selectExactMatch} from '../../../../lib/resolvers.ts';
import {ConfigFromSchema} from '../../../../types/schema.ts';
import {ViewSpec} from '../../../../types/view-spec.ts';

export const spec: ViewSpec = {
    viewId: 'geometry-angle-arithmetic',
    generalLabels: []
};

export const GeometryAngleArithmeticViewSchema = {
    taskAbility: [[
        Ability.ProcedureUnderstanding,
        Ability.ProcedureExecution,
        Ability.ProcedureInversion
    ], selectExactMatch]
} as const;

export type GeometryAngleArithmeticViewConfig = ConfigFromSchema<
    typeof GeometryAngleArithmeticViewSchema
>;
