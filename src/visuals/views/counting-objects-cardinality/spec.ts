import {ViewSpec} from '../../../types/view-spec.ts';
import {Ability, Area, Scope, deductCompatible} from 'edugraph-ts';
import { ConfigFromSchema } from '../../../types/schema.ts';
import { resolveRangeFromLabels } from '../../../lib/ontology.ts';
import { extractFirstMatch } from '../../../lib/resolvers.ts';

export const spec: ViewSpec = {
    viewId: 'counting-objects-cardinality',
    supportedLabels: [
        Area.Numeration,
        Area.NumericIdentity,
        Scope.PhysicalNumbers,
        Scope.NumericRange,
        Scope.NumbersWithoutZero,
        Scope.AdditiveCount,
        Scope.ArabicNumerals,
        Scope.ObjectArrangement,
        Ability.ProcedureUnderstanding
    ]
};

export const CountingObjectsCardinalityGeneralLabels = [
    Area.Numeration,
    Area.NumericIdentity,
    Scope.PhysicalNumbers,
    Scope.AdditiveCount,
    Scope.ArabicNumerals,
    Ability.ProcedureUnderstanding
];

export const CountingObjectsCardinalityViewSchema = {
    arrangement: extractFirstMatch([
        Scope.LinearArrangement,
        Scope.CircularArrangement,
        Scope.ScatteredArrangement
    ], Scope.ScatteredArrangement),
    range: [
        // TODO: deductCompatible is exclusively usable for children of NumericRange family.
        // It would be beneficial to have logical constraints relations on other properties
        // such as arrangement to use deductCompatible for them as well.
        deductCompatible([Scope.NumbersLargerZero, Scope.NumbersSmaller100]),
        (labels: string[]) => resolveRangeFromLabels(deductCompatible(labels as any))
    ]
} as const;

export type CountingObjectsCardinalityViewConfig = ConfigFromSchema<typeof CountingObjectsCardinalityViewSchema>;
