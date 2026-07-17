import {ViewSpec} from '../../../types/view-spec.ts';
import {Ability, Area, deductCompatible, Scope} from 'edugraph-ts';
import { ConfigFromSchema } from '../../../types/schema.ts';
import { resolveRangeFromLabels } from '../../../lib/ontology.ts';

export const spec: ViewSpec = {
    viewId: 'place-value-decompose-teen',
    supportedLabels: [
        Area.BaseOperations,
        Scope.PhysicalNumbers,
        Scope.NumericRange,
        Scope.NumbersWithZero,
        Ability.ProcedureExecution
    ]
};

export const PlaceValueDecomposeTeenGeneralLabels = [
    Scope.PhysicalNumbers,
    Ability.ProcedureExecution
];

export const PlaceValueDecomposeTeenViewSchema = {
    // TODO: Consider other ontological properties like Scope.PhysicalNumbers
    range: [
        deductCompatible([Scope.NumbersLargerZero, Scope.NumbersSmaller10000]),
        (labels: string[]) => resolveRangeFromLabels(deductCompatible(labels as any))
    ]
} as const;

export type PlaceValueDecomposeTeenViewConfig = ConfigFromSchema<typeof PlaceValueDecomposeTeenViewSchema>;
