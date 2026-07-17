import {ViewSpec} from '../../../types/view-spec.ts';
import {Ability, Area, Scope} from 'edugraph-ts';
import { ConfigFromSchema } from '../../../types/schema.ts';
import { deductCompatible, resolveRangeFromLabels } from '../../../lib/ontology.ts';

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

export const OperationsBoxesGeneralLabels = [
    Scope.ArabicNumerals,
    Ability.ProcedureExecution
];

export const OperationsBoxesViewSchema = {
    operation: [
        Area.Addition,
        Area.Subtraction,
        Area.Multiplication,
        Area.Division
    ],
    range: [
        [
            Scope.NumbersSmaller10,
            Scope.NumbersSmaller20,
            Scope.NumbersSmaller100,
            Scope.NumbersSmaller1000
        ],
        (labels: string[]) => resolveRangeFromLabels(deductCompatible(labels))
    ]
} as const;

export type OperationsBoxesViewConfig = ConfigFromSchema<typeof OperationsBoxesViewSchema>;
