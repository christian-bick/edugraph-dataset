import {ViewSpec} from '../../../../types/view-spec.ts';
import {Ability, Area, Scope, deductAdmitting} from 'edugraph-ts';
import { ConfigFromSchema } from '../../../../types/schema.ts';

export const spec: ViewSpec = {
    viewId: 'measure-length-decimal',
    generalLabels: [
        Scope.ArabicNumerals,
        Scope.Base10,
        Ability.VisualReception,
        Ability.ProcedureExecution
    ],
    rejectedLabels: [
        Scope.IntegerNumbers,
        Area.Estimation,
        ...deductAdmitting([Scope.NumbersLarger20])
    ]
};


export const MeasureLengthDecimalViewSchema = {} as const;

export type MeasureLengthDecimalViewConfig = ConfigFromSchema<typeof MeasureLengthDecimalViewSchema>;
