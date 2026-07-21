import {ViewSpec} from '../../../../types/view-spec.ts';
import {Ability, Area, Scope} from 'edugraph-ts';
import { ConfigFromSchema } from '../../../../types/schema.ts';

export const spec: ViewSpec = {
    viewId: 'measure-compare',
    generalLabels: [
        Area.Measurement,
        Scope.NumericRange,
        Scope.ArabicNumerals,
        Scope.NumbersWithoutZero,
        Ability.ProcedureExecution,
        Scope.LengthMeasurement,
        Scope.WeightMeasurement
    ],
};


export const MeasureCompareViewSchema = {} as const;

export type MeasureCompareViewConfig = ConfigFromSchema<typeof MeasureCompareViewSchema>;
