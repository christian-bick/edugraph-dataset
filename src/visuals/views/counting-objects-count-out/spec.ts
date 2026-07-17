import { ViewSpec } from '../../../types/view-spec.ts';
import { Ability, Area, Scope, deductCompatible } from 'edugraph-ts';
import { ConfigFromSchema } from '../../../types/schema.ts';
import { resolveRangeFromLabels } from '../../../lib/ontology.ts';
import { extractFirstMatch } from '../../../lib/resolvers.ts';

export const spec: ViewSpec = {
    viewId: 'counting-objects-count-out',
    supportedLabels: [
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

export const CountingObjectsCountOutGeneralLabels = [
    Area.Numeration,
    Scope.PhysicalNumbers,
    Scope.NumbersWithoutZero,
    Scope.AdditiveCount,
    Ability.ProcedureExecution,
    Scope.ArabicNumerals,
    // TODO: Ontological relations would be beneficial here
];

export const CountingObjectsCountOutViewSchema = {
    range: [
        deductCompatible([Scope.NumbersLargerZero, Scope.NumbersSmaller100]),
        (labels: string[]) => resolveRangeFromLabels(deductCompatible(labels as any))
    ],
    arrangement: [
        // TODO: Ontological relations would be beneficial for arrangements
        [Scope.LinearArrangement, Scope.CircularArrangement, Scope.ScatteredArrangement],
        extractFirstMatch([Scope.LinearArrangement, Scope.CircularArrangement, Scope.ScatteredArrangement], Scope.ScatteredArrangement)
    ]
} as const;

export type CountingObjectsCountOutViewConfig = ConfigFromSchema<typeof CountingObjectsCountOutViewSchema>;
