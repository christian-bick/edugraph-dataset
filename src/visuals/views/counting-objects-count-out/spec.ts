import { ViewSpec } from '../../../types/view-spec.ts';
import { Ability, Area, Scope, deductCompatible } from 'edugraph-ts';
import { ConfigFromSchema } from '../../../types/schema.ts';
import { resolveRangeFromLabels } from '../../../lib/ontology.ts';

export const spec: ViewSpec = {
    viewId: 'counting-objects-count-out',
    generalLabels: [
        Area.Numeration,
        Scope.PhysicalNumbers,
        Scope.NumericRange,
        Scope.NumbersWithoutZero,
        Scope.AdditiveCount,
        Ability.ProcedureExecution,
        Scope.ArabicNumerals
    ]
};


export const CountingObjectsCountOutViewSchema = {
    arrangement: [Scope.LinearArrangement, Scope.CircularArrangement, Scope.ScatteredArrangement]
} as const;

export type CountingObjectsCountOutViewConfig = ConfigFromSchema<typeof CountingObjectsCountOutViewSchema>;
