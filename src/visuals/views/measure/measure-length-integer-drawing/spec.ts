import {requireTargetLabels, rejectTargetLabels} from '../../../../lib/target-policies.ts';
import {Ability, Area, Scope, deductAdmitting} from 'edugraph-ts';
import {ConfigFromSchema} from '../../../../types/schema.ts';
import {ViewSpec} from '../../../../types/view-spec.ts';

export const spec: ViewSpec = {
    viewId: 'measure-length-integer-drawing',
    generalLabels: [
        Scope.ArabicNumerals,
        Scope.Base10,
        Ability.VisualReception,
        Ability.VisualArticulation,
        Ability.ProcedureExecution
    ],
    compatibility: [
        requireTargetLabels('drawing-request', [Ability.VisualArticulation]),
        rejectTargetLabels('integer-length-domain', [
            Scope.DecimalNumbers,
            Area.Estimation,
            ...deductAdmitting([Scope.NumbersLarger100])
        ])
    ],
};

export const MeasureLengthIntegerDrawingViewSchema = {} as const;
export type MeasureLengthIntegerDrawingViewConfig = ConfigFromSchema<
    typeof MeasureLengthIntegerDrawingViewSchema
>;
