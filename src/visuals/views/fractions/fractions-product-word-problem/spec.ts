import {Ability, Scope} from 'edugraph-ts';
import type {ConfigFromSchema} from '../../../../types/schema.ts';
import type {ViewSpec} from '../../../../types/view-spec.ts';

export const spec: ViewSpec = {
    viewId: 'fractions-product-word-problem',
    generalLabels: [Ability.TextualReception, Ability.ProcedureExecution, Scope.ArabicNumerals, Scope.Base10,
        Scope.Numberline, Scope.BarModel, Scope.NumbersWithoutZero]
};

export const FractionsProductWordProblemViewSchema = {} as const;
export type FractionsProductWordProblemViewConfig = ConfigFromSchema<typeof FractionsProductWordProblemViewSchema>;
