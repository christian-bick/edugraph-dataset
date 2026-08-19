import {Ability} from 'edugraph-ts';
import {hasLabel, selectExactMatch} from '../../../../lib/resolvers.ts';
import {ConfigFromSchema} from '../../../../types/schema.ts';
import {ViewSpec} from '../../../../types/view-spec.ts';

export const spec: ViewSpec = {
    viewId: 'shape-square-array',
    generalLabels: []
};

export const ShapeSquareArrayViewSchema = {
    taskAbility: [
        [
            Ability.Interpretation,
            Ability.VisualArticulation,
            Ability.ProcedureExecution,
            Ability.ProcedureInversion,
            Ability.ProcedureUnderstanding
        ],
        selectExactMatch
    ],
    useStory: [[Ability.TextualReception], hasLabel(Ability.TextualReception)]
} as const;

export type ShapeSquareArrayViewConfig = ConfigFromSchema<
    typeof ShapeSquareArrayViewSchema
>;
