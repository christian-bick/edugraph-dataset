import {ViewSpec} from '../../../types/view-spec.ts';
import {Ability, Area, deductCompatible, Scope} from 'edugraph-ts';
import { ConfigFromSchema } from '../../../types/schema.ts';
import { resolveRangeFromLabels } from '../../../lib/ontology.ts';
import { extractFirstMatch } from '../../../lib/resolvers.ts';

export const spec: ViewSpec = {
    viewId: 'counting-objects-simple',
    generalLabels: [
        Area.Numeration,
        Scope.PhysicalNumbers,
        Scope.NumericRange,
        Scope.NumbersWithoutZero,
        Scope.ArabicNumerals,
        Ability.ProcedureExecution,
        Ability.ProcedureUnderstanding
    ]
};


export const CountingObjectsSimpleViewSchema = {
    arrangement: [
        [Scope.LinearArrangement, Scope.CircularArrangement, Scope.ScatteredArrangement],
        // TODO: Could use deductCompatible if arrangements had logical constraint relations
        extractFirstMatch([Scope.LinearArrangement, Scope.CircularArrangement, Scope.ScatteredArrangement], Scope.ScatteredArrangement)
    ]
} as const;

export type CountingObjectsSimpleViewConfig = ConfigFromSchema<typeof CountingObjectsSimpleViewSchema>;
