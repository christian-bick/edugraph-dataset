import {Ability, Scope} from 'edugraph-ts';
import {hasLabel} from '../../../../lib/resolvers.ts';
import {ViewSpec} from '../../../../types/view-spec.ts';
import {ConfigFromSchema} from '../../../../types/schema.ts';

export const spec: ViewSpec = {
    viewId: 'measurement-line-plot',
    compatibility: [{
        id: 'unit-step-whole-measurements',
        dependencies: [
            {scope: 'view', label: Scope.StepsOf1},
            {scope: 'generator', label: Scope.IntegerNumbers}
        ],
        predicate: labels => !labels.exact('view', Scope.StepsOf1)
            || labels.exact('generator', Scope.IntegerNumbers)
    }],
    generalLabels: [
        Scope.LinePlot,
        Scope.ProvidedMeasurement,
        Ability.VisualArticulation
    ]
};

export const MeasurementLinePlotViewSchema = {
    usesUnitSteps: [
        [Scope.StepsOf1],
        hasLabel(Scope.StepsOf1)
    ]
} as const;
export type MeasurementLinePlotViewConfig = ConfigFromSchema<typeof MeasurementLinePlotViewSchema>;
