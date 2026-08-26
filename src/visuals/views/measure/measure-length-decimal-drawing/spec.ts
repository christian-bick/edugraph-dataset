import {Ability, Area, Scope, deductAdmitting} from 'edugraph-ts';
import {ConfigFromSchema} from '../../../../types/schema.ts';
import {ViewSpec} from '../../../../types/view-spec.ts';

export const spec: ViewSpec = {
    viewId: 'measure-length-decimal-drawing',
    generalLabels: [
        Scope.ArabicNumerals,
        Scope.Base10,
        Ability.VisualReception,
        Ability.VisualArticulation,
        Ability.ProcedureExecution
    ],
    requiredLabels: [Ability.VisualArticulation],
    rejectedLabels: [
        Scope.IntegerNumbers,
        Area.Estimation,
        ...deductAdmitting([Scope.NumbersLarger20])
    ]
};

export const MeasureLengthDecimalDrawingViewSchema = {} as const;
export type MeasureLengthDecimalDrawingViewConfig = ConfigFromSchema<
    typeof MeasureLengthDecimalDrawingViewSchema
>;
