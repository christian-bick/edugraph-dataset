import {Ability, Scope} from 'edugraph-ts';
import {ConfigFromSchema} from '../../../../types/schema.ts';
import {ViewSpec} from '../../../../types/view-spec.ts';

export const spec: ViewSpec = {
    viewId: 'place-value-hundreds-bundles',
    rejectedLabels: [Scope.MultiplesOf10],
    generalLabels: [
        Scope.PhysicalNumbers,
        Scope.ArabicNumerals,
        Ability.ProcedureUnderstanding
    ]
};

export const PlaceValueHundredsBundlesViewSchema = {} as const;

export type PlaceValueHundredsBundlesViewConfig = ConfigFromSchema<typeof PlaceValueHundredsBundlesViewSchema>;
