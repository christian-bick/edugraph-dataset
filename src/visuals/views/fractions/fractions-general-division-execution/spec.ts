import {Ability, Scope} from 'edugraph-ts';
import type {ConfigFromSchema} from '../../../../types/schema.ts';
import type {ViewSpec} from '../../../../types/view-spec.ts';

export const spec: ViewSpec = {
    viewId: 'fractions-general-division-execution',
    generalLabels: [Ability.ProcedureExecution, Scope.ArabicNumerals, Scope.Base10,
        Scope.Numberline, Scope.BarModel, Scope.NumbersWithZero]
};

export const FractionsGeneralDivisionExecutionViewSchema = {} as const;
export type FractionsGeneralDivisionExecutionViewConfig = ConfigFromSchema<typeof FractionsGeneralDivisionExecutionViewSchema>;
