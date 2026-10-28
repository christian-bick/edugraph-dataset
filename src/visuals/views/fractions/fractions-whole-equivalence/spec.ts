import {Ability, Scope} from 'edugraph-ts';
import {ConfigFromSchema} from '../../../../types/schema.ts';
import {ViewSpec} from '../../../../types/view-spec.ts';

export const spec: ViewSpec = {
    viewId: 'fractions-whole-equivalence',
    generalLabels: [Scope.ArabicNumerals, Ability.Formalization, Scope.Base10, Scope.NumbersWithoutZero]
};

export const FractionsWholeEquivalenceViewSchema = {} as const;

export type FractionsWholeEquivalenceViewConfig = ConfigFromSchema<
    typeof FractionsWholeEquivalenceViewSchema
>;
