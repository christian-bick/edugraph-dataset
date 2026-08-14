import {Ability, Scope} from 'edugraph-ts';
import {selectExactMatch} from '../../../../lib/resolvers.ts';
import {ConfigFromSchema} from '../../../../types/schema.ts';
import {ViewSpec} from '../../../../types/view-spec.ts';

export const spec: ViewSpec = {
    viewId: 'measurement-word-problem',
    generalLabels: [Ability.TextualReception]
};

export const MeasurementWordProblemViewSchema = {
    measurement: [
        [Scope.WeightMeasurement, Scope.LiquidVolumes],
        selectExactMatch
    ],
    scale: [
        [Scope.GramScale, Scope.KilogramScale, Scope.LiterScale],
        selectExactMatch
    ]
} as const;

export type MeasurementWordProblemViewConfig = ConfigFromSchema<
    typeof MeasurementWordProblemViewSchema
>;
