import {Ability} from 'edugraph-ts';
import {ConfigFromSchema} from '../../../../types/schema.ts';
import {ViewSpec} from '../../../../types/view-spec.ts';

export const spec: ViewSpec = {
    viewId: 'shape-patterns-explanation',
    generalLabels: [
        Ability.ProcedureUnderstanding,
        Ability.TextualArticulation
    ]
};

export const ShapePatternsExplanationViewSchema = {} as const;

export type ShapePatternsExplanationViewConfig = ConfigFromSchema<
    typeof ShapePatternsExplanationViewSchema
>;
