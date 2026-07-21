import {ViewSpec} from '../../../types/view-spec.ts';
import {Ability, Area, Scope} from 'edugraph-ts';
import { ConfigFromSchema } from '../../../types/schema.ts';

export const spec: ViewSpec = {
    viewId: 'place-value-decompose-teen',
    generalLabels: [
        Area.BaseOperations,
        Scope.PhysicalNumbers,
        Scope.NumericRange,
        Scope.NumbersWithZero,
        Ability.ProcedureExecution,
        Scope.ArabicNumerals
    ]
};


export const PlaceValueDecomposeTeenViewSchema = {} as const;

export type PlaceValueDecomposeTeenViewConfig = ConfigFromSchema<typeof PlaceValueDecomposeTeenViewSchema>;
