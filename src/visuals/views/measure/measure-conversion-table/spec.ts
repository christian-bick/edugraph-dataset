import {Ability, deductAdmitting, Scope} from 'edugraph-ts';
import {ConfigFromSchema} from '../../../../types/schema.ts';
import {ViewSpec} from '../../../../types/view-spec.ts';

export const spec: ViewSpec = {
    viewId: 'measure-conversion-table',
    generalLabels: [Scope.ArabicNumerals, Ability.Formalization],
    rejectedLabels: [
        ...deductAdmitting([Ability.ConceptDerivation]),
        ...deductAdmitting([Ability.ProcedureExecution])
    ]
};

export const MeasureConversionTableViewSchema = {} as const;

export type MeasureConversionTableViewConfig = ConfigFromSchema<
    typeof MeasureConversionTableViewSchema
>;
