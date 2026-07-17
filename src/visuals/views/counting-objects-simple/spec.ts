import {ViewSpec} from '../../../types/view-spec.ts';
import {Ability, Area, deductCompatible, Scope} from 'edugraph-ts';
import { ConfigFromSchema } from '../../../types/schema.ts';
import { resolveRangeFromLabels } from '../../../lib/ontology.ts';
import { extractFirstMatch } from '../../../lib/resolvers.ts';

export const spec: ViewSpec = {
    viewId: 'counting-objects-simple',
    supportedLabels: [
        Area.Numeration,
        Scope.PhysicalNumbers,
        Scope.NumericRange,
        Scope.NumbersWithoutZero,
        Scope.ArabicNumerals,
        Scope.ObjectArrangement,
        Ability.ProcedureExecution,
        Ability.ProcedureUnderstanding
    ]
};

export const CountingObjectsSimpleGeneralLabels = [
    Area.Numeration,
    Scope.PhysicalNumbers,
    Scope.NumbersWithoutZero,
    Scope.ArabicNumerals,
    Scope.NumericRange,
    Scope.ObjectArrangement,
    Ability.ProcedureExecution,
    Ability.ProcedureUnderstanding
];

export const CountingObjectsSimpleViewSchema = {
    arrangement: [
        [Scope.LinearArrangement, Scope.CircularArrangement, Scope.ScatteredArrangement],
        // TODO: Could use deductCompatible if arrangements had logical constraint relations
        extractFirstMatch([Scope.LinearArrangement, Scope.CircularArrangement, Scope.ScatteredArrangement], Scope.ScatteredArrangement)
    ],
    range: [
        deductCompatible([Scope.NumbersLargerZero]),
        (labels: string[]) => resolveRangeFromLabels(deductCompatible(labels as any))
    ]
} as const;

export type CountingObjectsSimpleViewConfig = ConfigFromSchema<typeof CountingObjectsSimpleViewSchema>;
