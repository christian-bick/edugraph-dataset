import {Ability, Scope} from 'edugraph-ts';
import {ConfigFromSchema} from '../../../../types/schema.ts';
import {ViewSpec} from '../../../../types/view-spec.ts';

export const spec: ViewSpec = {
    viewId: 'numbers-read-standard',
    generalLabels: [
        Scope.ArabicNumerals,
        Ability.TextualReception
    ]
};

export const NumbersReadStandardViewSchema = {} as const;

export type NumbersReadStandardViewConfig = ConfigFromSchema<typeof NumbersReadStandardViewSchema>;
