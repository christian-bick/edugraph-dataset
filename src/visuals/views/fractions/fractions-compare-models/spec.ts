import {Ability, Scope} from 'edugraph-ts';
import {ConfigFromSchema} from '../../../../types/schema.ts';
import {ViewSpec} from '../../../../types/view-spec.ts';

export const spec: ViewSpec = {
    viewId: 'fractions-compare-models',
    generalLabels: [
        Scope.VisualNumbers,
        Scope.ArabicNumerals,
        Scope.Base10,
        Ability.LogicalInference
    ]
};

export const FractionsCompareModelsViewSchema = {} as const;

export type FractionsCompareModelsViewConfig = ConfigFromSchema<
    typeof FractionsCompareModelsViewSchema
>;
