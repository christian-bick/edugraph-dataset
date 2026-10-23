import {Ability, Scope} from 'edugraph-ts';
import {selectExactLabelMap} from '../../../../lib/resolvers.ts';
import type {ConfigFromSchema} from '../../../../types/schema.ts';
import type {ViewSpec} from '../../../../types/view-spec.ts';
import {numericalDisplayEvidence, numericalDisplayTarget} from '../numerical-distribution-construction-policy.ts';

export const spec: ViewSpec = {viewId: 'numerical-distribution-plot', generalLabels: [Ability.VisualArticulation],
    compatibility: [numericalDisplayTarget, numericalDisplayEvidence]};
export const NumericalDistributionPlotViewSchema = {plot: [[Scope.LinePlot, Scope.Histogram, Scope.BoxPlot],
    selectExactLabelMap([[Scope.LinePlot, 'line-plot'], [Scope.Histogram, 'histogram'], [Scope.BoxPlot, 'box-plot']] as const),
    [[Scope.LinePlot], [Scope.Histogram], [Scope.BoxPlot]]]} as const;
export type NumericalDistributionPlotViewConfig = ConfigFromSchema<typeof NumericalDistributionPlotViewSchema>;
