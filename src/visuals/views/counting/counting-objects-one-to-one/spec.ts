import {ViewSpec} from '../../../../types/view-spec.ts';
import {Ability, Area, Scope} from 'edugraph-ts';
import { ConfigFromSchema } from '../../../../types/schema.ts';

export const spec: ViewSpec = {
    viewId: 'counting-objects-one-to-one',
    generalLabels: [
        Area.Numeration,
        Scope.PhysicalNumbers,
        Scope.NumbersWithoutZero,
        Scope.AdditiveCount,
        Scope.ArabicNumerals,
        Scope.NumericRange,
        Ability.ProcedureExecution
    ],
};


export const CountingObjectsOneToOneViewSchema = {
    arrangement: [Scope.LinearArrangement, Scope.CircularArrangement, Scope.ScatteredArrangement]
} as const;

export type CountingObjectsOneToOneViewConfig = ConfigFromSchema<typeof CountingObjectsOneToOneViewSchema>;
