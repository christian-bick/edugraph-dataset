import {Ability, Scope} from 'edugraph-ts';
import {ConfigFromSchema} from '../../../../types/schema.ts';
import {ViewSpec} from '../../../../types/view-spec.ts';

export const spec: ViewSpec = {
    viewId: 'fractions-interpretation-model',
    generalLabels: [
        Scope.VisualNumbers,
        Ability.Interpretation
    ]
};

export const FractionsInterpretationModelViewSchema = {} as const;

export type FractionsInterpretationModelViewConfig = ConfigFromSchema<
    typeof FractionsInterpretationModelViewSchema
>;
