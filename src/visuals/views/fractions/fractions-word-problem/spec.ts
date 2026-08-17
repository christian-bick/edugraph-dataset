import {Ability, Scope} from 'edugraph-ts';
import {ConfigFromSchema} from '../../../../types/schema.ts';
import {ViewSpec} from '../../../../types/view-spec.ts';

export const spec: ViewSpec = {
    viewId: 'fractions-word-problem',
    generalLabels: [
        Ability.TextualReception,
        Scope.VisualNumbers
    ]
};

export const FractionsWordProblemViewSchema = {} as const;

export type FractionsWordProblemViewConfig = ConfigFromSchema<
    typeof FractionsWordProblemViewSchema
>;
