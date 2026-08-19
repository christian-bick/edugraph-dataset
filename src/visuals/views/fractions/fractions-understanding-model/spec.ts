import {Ability, Scope} from 'edugraph-ts';
import {ConfigFromSchema} from '../../../../types/schema.ts';
import {ViewSpec} from '../../../../types/view-spec.ts';

export const spec: ViewSpec = {
    viewId: 'fractions-understanding-model',
    generalLabels: [
        Scope.VisualNumbers,
        Ability.ProcedureUnderstanding,
        Ability.Formalization
    ]
};

export const FractionsUnderstandingModelViewSchema = {} as const;

export type FractionsUnderstandingModelViewConfig = ConfigFromSchema<
    typeof FractionsUnderstandingModelViewSchema
>;
