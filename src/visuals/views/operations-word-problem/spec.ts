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


export const OperationsWordProblemViewSchema = {} as const;

export type OperationsWordProblemViewConfig = ConfigFromSchema<typeof OperationsWordProblemViewSchema>;
