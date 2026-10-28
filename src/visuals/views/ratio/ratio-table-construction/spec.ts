import {Ability, Scope} from 'edugraph-ts';
import type {ConfigFromSchema} from '../../../../types/schema.ts';
import type {ViewSpec} from '../../../../types/view-spec.ts';

export const spec: ViewSpec = {
    viewId: 'ratio-table-construction',
    generalLabels: [Scope.TabularAlgebraicRepresentation, Scope.ArabicNumerals, Scope.Base10,
        Scope.NumbersWithoutZero, Ability.VisualArticulation]
};

export const RatioTableConstructionViewSchema = {} as const;
export type RatioTableConstructionViewConfig = ConfigFromSchema<typeof RatioTableConstructionViewSchema>;
