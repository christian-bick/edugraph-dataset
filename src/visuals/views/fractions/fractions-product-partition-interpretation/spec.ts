import {Ability, Scope} from 'edugraph-ts';
import type {ConfigFromSchema} from '../../../../types/schema.ts';
import type {ViewSpec} from '../../../../types/view-spec.ts';

export const spec: ViewSpec = {
    viewId: 'fractions-product-partition-interpretation',
    generalLabels: [Ability.Interpretation, Scope.ArabicNumerals, Scope.Base10, Scope.Numberline, Scope.BarModel, Scope.NumbersWithZero]
};

export const FractionsProductPartitionInterpretationViewSchema = {} as const;
export type FractionsProductPartitionInterpretationViewConfig = ConfigFromSchema<typeof FractionsProductPartitionInterpretationViewSchema>;
