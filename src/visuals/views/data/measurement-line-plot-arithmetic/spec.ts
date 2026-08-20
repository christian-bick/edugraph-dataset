import {Ability, Area, Scope} from 'edugraph-ts';
import {ConfigFromSchema} from '../../../../types/schema.ts';
import {ViewSpec} from '../../../../types/view-spec.ts';

export const spec: ViewSpec = {
    viewId: 'measurement-line-plot-arithmetic',
    generalLabels: [
        Scope.LinePlot,
        Scope.LengthMeasurement,
        Scope.ProvidedMeasurement,
        Ability.ProcedureExecution
    ],
    requiredLabels: [Area.FractionArithmetic]
};

export const MeasurementLinePlotArithmeticViewSchema = {} as const;
export type MeasurementLinePlotArithmeticViewConfig = ConfigFromSchema<typeof MeasurementLinePlotArithmeticViewSchema>;
