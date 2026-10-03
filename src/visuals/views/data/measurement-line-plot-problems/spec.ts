import {Ability, Scope} from 'edugraph-ts';
import {requireTargetLabels} from '../../../../lib/target-policies.ts';
import {ConfigFromSchema} from '../../../../types/schema.ts';
import {ViewSpec} from '../../../../types/view-spec.ts';

export const spec: ViewSpec = {
    viewId: 'measurement-line-plot-problems',
    generalLabels: [
        Scope.LinePlot,
        Scope.ProvidedMeasurement,
        Ability.TextualReception,
        Ability.ProcedureExecution
    ],
    compatibility: [
        requireTargetLabels('contextual-line-plot-calculation', [Ability.TextualReception])
    ]
};

export const MeasurementLinePlotProblemsViewSchema = {} as const;

export type MeasurementLinePlotProblemsViewConfig = ConfigFromSchema<
    typeof MeasurementLinePlotProblemsViewSchema
>;
