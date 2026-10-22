import {Ability, Scope} from 'edugraph-ts';
import type {ConfigFromSchema} from '../../../../types/schema.ts';
import type {ViewSpec} from '../../../../types/view-spec.ts';

export const spec: ViewSpec = {
    viewId: 'ratio-table-missing-values',
    generalLabels: [Scope.TabularAlgebraicRepresentation, Ability.ProcedureInversion]
};

export const RatioTableMissingValuesViewSchema = {} as const;
export type RatioTableMissingValuesViewConfig = ConfigFromSchema<typeof RatioTableMissingValuesViewSchema>;
