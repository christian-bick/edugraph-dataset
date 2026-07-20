import {ViewSpec} from '../../../types/view-spec.ts';
import {Ability, Area, deductCompatible, Scope} from 'edugraph-ts';
import { ConfigFromSchema } from '../../../types/schema.ts';
import { resolveRangeFromLabels } from '../../../lib/ontology.ts';

export const spec: ViewSpec = {
    viewId: 'place-value-compose-teen',
    supportedLabels: [
        Area.BaseOperations,
        Scope.PhysicalNumbers,
        Scope.NumericRange,
        Scope.NumbersWithZero,
        Ability.ProcedureExecution
    ,
        Scope.ArabicNumerals]
};


export const PlaceValueComposeTeenViewSchema = {
    // TODO: Consider other ontological properties like Scope.PhysicalNumbers
    range: [
        deductCompatible([Scope.NumbersLargerZero, Scope.NumbersSmaller10000]),
        resolveRangeFromLabels
    ]
} as const;

export type PlaceValueComposeTeenViewConfig = ConfigFromSchema<typeof PlaceValueComposeTeenViewSchema>;
