import {Ability, Scope} from 'edugraph-ts';
import {hasLabel} from '../../../../lib/resolvers.ts';
import {ConfigFromSchema} from '../../../../types/schema.ts';
import {ViewSpec} from '../../../../types/view-spec.ts';

export const spec: ViewSpec = {
    viewId: 'operations-word-problem-within-100',
    generalLabels: [
        Ability.TextualReception,
        Scope.ArabicNumerals
    ]
};

export const OperationsWordProblemWithin100ViewSchema = {
    useLengthContext: [
        [Scope.LengthMeasurement],
        hasLabel(Scope.LengthMeasurement)
    ]
} as const;

export type OperationsWordProblemWithin100ViewConfig = ConfigFromSchema<
    typeof OperationsWordProblemWithin100ViewSchema
>;
