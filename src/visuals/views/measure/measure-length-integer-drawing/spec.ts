import {Ability, Area, Scope, deductAdmitting} from 'edugraph-ts';
import {ConfigFromSchema} from '../../../../types/schema.ts';
import {ViewSpec} from '../../../../types/view-spec.ts';

export const spec: ViewSpec = {
    viewId: 'measure-length-integer-drawing',
    generalLabels: [
        Scope.ArabicNumerals,
        Ability.VisualReception,
        Ability.VisualArticulation,
        Ability.ProcedureExecution
    ],
    requiredLabels: [Ability.VisualArticulation],
    rejectedLabels: [
        Scope.DecimalNumbers,
        Area.Estimation,
        ...deductAdmitting([Scope.NumbersLarger100])
    ]
};

export const MeasureLengthIntegerDrawingViewSchema = {} as const;
export type MeasureLengthIntegerDrawingViewConfig = ConfigFromSchema<
    typeof MeasureLengthIntegerDrawingViewSchema
>;
