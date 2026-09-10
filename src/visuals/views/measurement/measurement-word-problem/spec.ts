import {Ability, Scope} from 'edugraph-ts';
import {selectExactLabelSetMap} from '../../../../lib/resolvers.ts';
import {ConfigFromSchema} from '../../../../types/schema.ts';
import {ViewSpec} from '../../../../types/view-spec.ts';

export const spec: ViewSpec = {
    viewId: 'measurement-word-problem',
    generalLabels: [Ability.TextualReception]
};

export const MeasurementWordProblemViewSchema = {
    scale: [
        [Scope.GramScale, Scope.KilogramScale, Scope.LiterScale, Scope.LiquidVolumes],
        selectExactLabelSetMap([
            [[Scope.GramScale], 'gram'],
            [[Scope.KilogramScale], 'kilogram'],
            [[Scope.LiquidVolumes, Scope.LiterScale], 'liter']
        ]),
        [[Scope.GramScale], [Scope.KilogramScale], [Scope.LiquidVolumes, Scope.LiterScale]]
    ]
} as const;

export type MeasurementWordProblemViewConfig = ConfigFromSchema<
    typeof MeasurementWordProblemViewSchema
>;
