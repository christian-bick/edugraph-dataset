import {Scope} from 'edugraph-ts';
import {ConfigFromSchema} from '../../../../types/schema.ts';
import {ViewSpec} from '../../../../types/view-spec.ts';

export const spec: ViewSpec = {
    viewId: 'fractions-whole-equivalence',
    generalLabels: [Scope.ArabicNumerals]
};

export const FractionsWholeEquivalenceViewSchema = {} as const;

export type FractionsWholeEquivalenceViewConfig = ConfigFromSchema<
    typeof FractionsWholeEquivalenceViewSchema
>;
