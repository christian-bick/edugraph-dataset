import { ViewSpec } from '../../../../types/view-spec.ts';
import { Ability, Scope } from 'edugraph-ts';
import { ConfigFromSchema } from '../../../../types/schema.ts';

export const spec: ViewSpec = {
    viewId: 'counting-objects-count-out',
    generalLabels: [
        Scope.PhysicalNumbers,
        Ability.ProcedureExecution,
        Scope.ArabicNumerals
    ]
};


export const CountingObjectsCountOutViewSchema = {
    arrangement: [Scope.LinearArrangement, Scope.CircularArrangement, Scope.ScatteredArrangement]
} as const;

export type CountingObjectsCountOutViewConfig = ConfigFromSchema<typeof CountingObjectsCountOutViewSchema>;
