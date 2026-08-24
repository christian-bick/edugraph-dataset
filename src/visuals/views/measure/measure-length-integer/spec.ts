import {ViewSpec} from '../../../../types/view-spec.ts';
import {Ability, Area, Scope, deductAdmitting} from 'edugraph-ts';
import { ConfigFromSchema } from '../../../../types/schema.ts';

export const spec: ViewSpec = {
    viewId: 'measure-length-integer',
    generalLabels: [
        Scope.ArabicNumerals,
        Ability.VisualReception,
        Ability.ProcedureExecution
    ],
    rejectedLabels: [
        Scope.DecimalNumbers,
        Area.Estimation,
        ...deductAdmitting([Scope.NumbersLarger100])
    ]
};


export const MeasureLengthIntegerViewSchema = {} as const;

export type MeasureLengthIntegerViewConfig = ConfigFromSchema<typeof MeasureLengthIntegerViewSchema>;
