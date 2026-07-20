import {ViewSpec} from '../../../types/view-spec.ts';
import {Ability, Area, deductCompatible, Scope} from 'edugraph-ts';
import { ConfigFromSchema } from '../../../types/schema.ts';
import { resolveRangeFromLabels } from '../../../lib/ontology.ts';

export const spec: ViewSpec = {
    viewId: 'operations-boxes',
    generalLabels: [
        Area.BaseOperations,
        Scope.ArabicNumerals,
        Scope.NumericRange,
        Scope.NumbersWithZero,
        Ability.ProcedureExecution
    ]
};


export const OperationsBoxesViewSchema = {} as const;

export type OperationsBoxesViewConfig = ConfigFromSchema<typeof OperationsBoxesViewSchema>;
