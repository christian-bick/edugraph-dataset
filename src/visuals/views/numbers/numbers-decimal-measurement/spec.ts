import {Ability, Area, Scope} from 'edugraph-ts';
import {ConfigFromSchema} from '../../../../types/schema.ts';
import {ViewSpec} from '../../../../types/view-spec.ts';

export const spec: ViewSpec = {
    viewId: 'numbers-decimal-measurement',
    generalLabels: [
        Area.DecimalEquivalence,
        Area.FractionNotation,
        Area.MeasuringWithUnits,
        Scope.FractionNumbers,
        Scope.LengthMeasurement,
        Scope.MeterScale,
        Scope.EqualShares,
        Scope.Equal,
        Scope.SingleFrameOfReference,
        Ability.Formalization
    ]
};

export const NumbersDecimalMeasurementViewSchema = {} as const;

export type NumbersDecimalMeasurementViewConfig = ConfigFromSchema<
    typeof NumbersDecimalMeasurementViewSchema
>;
