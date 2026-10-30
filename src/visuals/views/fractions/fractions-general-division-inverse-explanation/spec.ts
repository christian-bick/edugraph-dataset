import {Ability, Scope} from 'edugraph-ts';
import type {ConfigFromSchema} from '../../../../types/schema.ts';
import type {ViewSpec} from '../../../../types/view-spec.ts';

export const spec: ViewSpec = {
    viewId: 'fractions-general-division-inverse-explanation',
    generalLabels: [Ability.ProcedureUnderstanding, Scope.ArabicNumerals, Scope.Base10,
        Scope.Numberline, Scope.BarModel, Scope.NumbersWithZero]
};

export const FractionsGeneralDivisionInverseExplanationViewSchema = {} as const;
export type FractionsGeneralDivisionInverseExplanationViewConfig = ConfigFromSchema<typeof FractionsGeneralDivisionInverseExplanationViewSchema>;
