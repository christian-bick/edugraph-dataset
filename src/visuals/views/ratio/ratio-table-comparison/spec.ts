import {Ability, Area, Scope} from 'edugraph-ts';
import {requireTargetLabels} from '../../../../lib/target-policies.ts';
import type {ConfigFromSchema} from '../../../../types/schema.ts';
import type {ViewSpec} from '../../../../types/view-spec.ts';

export const spec: ViewSpec = {
    viewId: 'ratio-table-comparison',
    generalLabels: [Scope.TabularAlgebraicRepresentation, Scope.ArabicNumerals, Scope.Base10,
        Ability.ProcedureExecution],
    compatibility: [requireTargetLabels('ratio-comparison-request', [Area.RatioEquivalence])]
};

export const RatioTableComparisonViewSchema = {} as const;
export type RatioTableComparisonViewConfig = ConfigFromSchema<typeof RatioTableComparisonViewSchema>;
