import {ViewSpec} from '../../../types/view-spec.ts';
import {Ability, Area, deductCompatible, Scope} from 'edugraph-ts';
import { ConfigFromSchema } from '../../../types/schema.ts';
import { resolveRangeFromLabels } from '../../../lib/ontology.ts';

export const spec: ViewSpec = {
    viewId: 'operations-word-problem',
    generalLabels: [
        Area.BaseOperations,
        Scope.PhysicalNumbers,
        Scope.NumericRange,
        Ability.TextualReception
    ,
        Scope.ArabicNumerals]
};


export const OperationsWordProblemViewSchema = {
    operation: [
        Area.Addition,
        Area.Subtraction,
        Area.Multiplication,
        Area.Division
    ],
    // TODO: Consider other ontological properties like Scope.PhysicalNumbers
    range: [
        deductCompatible([Scope.NumbersWithZero, Scope.NumbersSmaller10000]),
        resolveRangeFromLabels
    ]
} as const;

export type OperationsWordProblemViewConfig = ConfigFromSchema<typeof OperationsWordProblemViewSchema>;
