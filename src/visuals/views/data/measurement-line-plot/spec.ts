import {Ability, Scope} from 'edugraph-ts';
import {hasLabel} from '../../../../lib/resolvers.ts';
import {ViewSpec} from '../../../../types/view-spec.ts';
import {ConfigFromSchema} from '../../../../types/schema.ts';

export const spec: ViewSpec = {
    viewId: 'measurement-line-plot',
    generalLabels: [Scope.LinePlot]
};

export const MeasurementLinePlotViewSchema = {
    constructPlot: [
        [Ability.VisualArticulation],
        hasLabel(Ability.VisualArticulation)
    ],
    usesUnitSteps: [
        [Scope.StepsOf1],
        hasLabel(Scope.StepsOf1)
    ],
    executeProcedure: [
        [Ability.ProcedureExecution],
        hasLabel(Ability.ProcedureExecution)
    ]
} as const;
export type MeasurementLinePlotViewConfig = ConfigFromSchema<typeof MeasurementLinePlotViewSchema>;
