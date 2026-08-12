import {Ability, Scope} from 'edugraph-ts';
import {ConfigFromSchema} from '../../../../types/schema.ts';
import {ViewSpec} from '../../../../types/view-spec.ts';

export const spec: ViewSpec = {
    viewId: 'place-value-tens-bundles',
    rejectedLabels: [Scope.MultiplesOf100],
    generalLabels: [
        Scope.PhysicalNumbers,
        Scope.ArabicNumerals,
        Ability.ProcedureUnderstanding
    ]
};

export const PlaceValueTensBundlesViewSchema = {} as const;

export type PlaceValueTensBundlesViewConfig = ConfigFromSchema<typeof PlaceValueTensBundlesViewSchema>;
