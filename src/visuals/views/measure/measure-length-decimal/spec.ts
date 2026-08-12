import {ViewSpec} from '../../../../types/view-spec.ts';
import {Ability, Area, Scope, deductAdmitting} from 'edugraph-ts';
import { ConfigFromSchema } from '../../../../types/schema.ts';
import { hasLabel } from '../../../../lib/resolvers.ts';

export const spec: ViewSpec = {
    viewId: 'measure-length-decimal',
    generalLabels: [
        Scope.ArabicNumerals,
        Ability.VisualReception,
        Ability.VisualArticulation,
        Ability.ProcedureExecution
    ],
    rejectedLabels: [
        Scope.IntegerNumbers,
        Area.Estimation,
        ...deductAdmitting([Scope.NumbersLarger20])
    ]
};


export const MeasureLengthDecimalViewSchema = {
    isReverse: [[], hasLabel(Ability.VisualArticulation)]
} as const;

export type MeasureLengthDecimalViewConfig = ConfigFromSchema<typeof MeasureLengthDecimalViewSchema>;
