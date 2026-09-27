import {Ability, Scope} from 'edugraph-ts';
import {ConfigFromSchema} from '../../../../types/schema.ts';
import {ViewSpec} from '../../../../types/view-spec.ts';

export const spec: ViewSpec = {
    viewId: 'place-value-hundreds-bundles-explanation',
    generalLabels: [
        Scope.PhysicalNumbers,
        Scope.ArabicNumerals,
        Ability.ProcedureUnderstanding
    ]
};

export const PlaceValueHundredsBundlesExplanationViewSchema = {} as const;

export type PlaceValueHundredsBundlesExplanationViewConfig = ConfigFromSchema<typeof PlaceValueHundredsBundlesExplanationViewSchema>;
