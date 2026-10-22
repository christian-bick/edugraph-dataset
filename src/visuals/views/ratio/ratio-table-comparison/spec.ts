import {Ability, Scope} from 'edugraph-ts';
import type {ConfigFromSchema} from '../../../../types/schema.ts';
import type {ViewSpec} from '../../../../types/view-spec.ts';

export const spec: ViewSpec = {
    viewId: 'ratio-table-comparison',
    generalLabels: [Scope.TabularAlgebraicRepresentation, Ability.ProcedureExecution]
};

export const RatioTableComparisonViewSchema = {} as const;
export type RatioTableComparisonViewConfig = ConfigFromSchema<typeof RatioTableComparisonViewSchema>;
