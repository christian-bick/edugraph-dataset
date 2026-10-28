import {Ability, Scope} from 'edugraph-ts';
import type {ConfigFromSchema} from '../../../../types/schema.ts';
import type {ViewSpec} from '../../../../types/view-spec.ts';

export const spec: ViewSpec = {
    viewId: 'fractions-division-model-construction',
    generalLabels: [Ability.VisualArticulation, Scope.ArabicNumerals, Scope.Base10]
};

export const FractionsDivisionModelConstructionViewSchema = {} as const;
export type FractionsDivisionModelConstructionViewConfig = ConfigFromSchema<typeof FractionsDivisionModelConstructionViewSchema>;
