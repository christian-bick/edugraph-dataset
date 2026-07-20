import {ViewSpec} from '../../../types/view-spec.ts';
import {Ability, Area, Scope} from 'edugraph-ts';
import { ConfigFromSchema } from '../../../types/schema.ts';

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


export const MeasureCompareViewSchema = {
    attribute: [
        ['length', 'height', 'weight'],
        (labels: string[]) => {
            if (labels.includes(Scope.LengthMeasurement)) return 'height';
            if (labels.includes(Scope.WeightMeasurement)) return 'weight';
            return 'length';
        }
    ]
} as const;

export type MeasureCompareViewConfig = ConfigFromSchema<typeof MeasureCompareViewSchema>;
