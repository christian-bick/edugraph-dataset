import {ViewSpec} from '../../../types/view-spec.ts';
import {Ability, Area, deductCompatible, Scope} from 'edugraph-ts';
import { ConfigFromSchema } from '../../../types/schema.ts';
import { resolveRangeFromLabels } from '../../../lib/ontology.ts';

export const spec: ViewSpec = {
    viewId: 'operations-boxes',
    supportedLabels: [
        Area.BaseOperations,
        Scope.ArabicNumerals,
        Scope.NumericRange,
        Scope.NumbersWithZero,
        Ability.ProcedureExecution
    ]
};


export const OperationsBoxesViewSchema = {
    operation: [
        Area.Addition,
        Area.Subtraction,
        Area.Multiplication,
        Area.Division
    ],
    range: [
        deductCompatible([Scope.NumbersLargerZero, Scope.NumbersSmaller10000]),
        resolveRangeFromLabels
    ]
} as const;

export type OperationsBoxesViewConfig = ConfigFromSchema<typeof OperationsBoxesViewSchema>;
