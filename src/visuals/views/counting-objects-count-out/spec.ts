import { ViewSpec } from '../../../types/view-spec.ts';
import { Ability, Area, Scope, deductCompatible } from 'edugraph-ts';
import { ConfigFromSchema } from '../../../types/schema.ts';
import { resolveRangeFromLabels } from '../../../lib/ontology.ts';
import { extractFirstMatch } from '../../../lib/resolvers.ts';

export const spec: ViewSpec = {
    viewId: 'counting-objects-count-out',
    generalLabels: [
        Area.Numeration,
        Scope.PhysicalNumbers,
        Scope.NumericRange,
        Scope.NumbersWithoutZero,
        Scope.AdditiveCount,
        Ability.ProcedureExecution,
        Scope.ArabicNumerals,
        Scope.ObjectArrangement
    ]
};


export const CountingObjectsCountOutViewSchema = {
    range: [
        deductCompatible([Scope.NumbersLargerZero, Scope.NumbersSmaller100]),
        resolveRangeFromLabels
    ],
    arrangement: [
        // TODO: Ontological relations would be beneficial for arrangements
        [Scope.LinearArrangement, Scope.CircularArrangement, Scope.ScatteredArrangement],
        extractFirstMatch([Scope.LinearArrangement, Scope.CircularArrangement, Scope.ScatteredArrangement], Scope.ScatteredArrangement)
    ]
} as const;

export type CountingObjectsCountOutViewConfig = ConfigFromSchema<typeof CountingObjectsCountOutViewSchema>;
