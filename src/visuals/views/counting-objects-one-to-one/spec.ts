import {ViewSpec} from '../../../types/view-spec.ts';
import {Ability, Area, Scope, deductCompatible} from 'edugraph-ts';
import { ConfigFromSchema } from '../../../types/schema.ts';
import { extractFirstMatch } from '../../../lib/resolvers.ts';
import { resolveRangeFromLabels } from '../../../lib/ontology.ts';

export const spec: ViewSpec = {
    viewId: 'counting-objects-one-to-one',
    generalLabels: [
        Area.Numeration,
        Scope.NumbersWithoutZero,
        Scope.AdditiveCount,
        Scope.ArabicNumerals,
        Scope.ObjectArrangement,
        Scope.NumericRange,
        Ability.ProcedureExecution
    ],
};


export const CountingObjectsOneToOneViewSchema = {
    arrangement: [
        [Scope.LinearArrangement, Scope.CircularArrangement, Scope.ScatteredArrangement],
        extractFirstMatch([Scope.LinearArrangement, Scope.CircularArrangement, Scope.ScatteredArrangement], Scope.ScatteredArrangement)
    ],
    range: [
        deductCompatible([Scope.NumbersLargerZero, Scope.NumbersSmaller10000]),
        // TODO: deductCompatible is exclusively for NumericRange, add relations for other properties to utilize it
        resolveRangeFromLabels
    ]
} as const;

export type CountingObjectsOneToOneViewConfig = ConfigFromSchema<typeof CountingObjectsOneToOneViewSchema>;
