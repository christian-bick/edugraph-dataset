import {Ability, Scope} from 'edugraph-ts';
import {hasLabel} from '../../../../lib/resolvers.ts';
import {ViewSpec} from '../../../../types/view-spec.ts';
import {ConfigFromSchema} from '../../../../types/schema.ts';

export const spec: ViewSpec = {
    viewId: 'measurement-line-plot',
    generalLabels: [Scope.LinePlot, Ability.VisualArticulation]
};

export const MeasurementLinePlotViewSchema = {
    usesUnitSteps: [
        [Scope.StepsOf1],
        hasLabel(Scope.StepsOf1)
    ],
    plotCollectedMeasurements: [
        [Ability.ProcedureExecution],
        hasLabel(Ability.ProcedureExecution)
    ]
} as const;
export type MeasurementLinePlotViewConfig = ConfigFromSchema<typeof MeasurementLinePlotViewSchema>;
