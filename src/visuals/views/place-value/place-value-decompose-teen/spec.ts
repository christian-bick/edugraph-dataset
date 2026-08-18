import {ViewSpec} from '../../../../types/view-spec.ts';
import {Ability, Area, Scope} from 'edugraph-ts';
import { ConfigFromSchema } from '../../../../types/schema.ts';

export const spec: ViewSpec = {
    viewId: 'place-value-decompose-teen',
    generalLabels: [
        Area.Sum,
        Area.PartitionOfCollections,
        Scope.PhysicalNumbers,
        Ability.ProcedureExecution,
        Scope.ArabicNumerals
    ]
};


export const PlaceValueDecomposeTeenViewSchema = {} as const;

export type PlaceValueDecomposeTeenViewConfig = ConfigFromSchema<typeof PlaceValueDecomposeTeenViewSchema>;
