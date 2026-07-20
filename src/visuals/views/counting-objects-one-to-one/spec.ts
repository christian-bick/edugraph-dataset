import {ViewSpec} from '../../../types/view-spec.ts';
import {Ability, Area, Scope} from 'edugraph-ts';
import { ConfigFromSchema } from '../../../types/schema.ts';
import { extractFirstMatch } from '../../../lib/resolvers.ts';

export const spec: ViewSpec = {
    viewId: 'counting-objects-one-to-one',
    generalLabels: [
        Area.Numeration,
        Scope.NumbersWithoutZero,
        Scope.AdditiveCount,
        Scope.ArabicNumerals,
        Scope.NumericRange,
        Ability.ProcedureExecution
    ],
};


export const CountingObjectsOneToOneViewSchema = {
    arrangement: [
        [Scope.LinearArrangement, Scope.CircularArrangement, Scope.ScatteredArrangement],
        extractFirstMatch([Scope.LinearArrangement, Scope.CircularArrangement, Scope.ScatteredArrangement], Scope.ScatteredArrangement)
    ]
} as const;

export type CountingObjectsOneToOneViewConfig = ConfigFromSchema<typeof CountingObjectsOneToOneViewSchema>;
