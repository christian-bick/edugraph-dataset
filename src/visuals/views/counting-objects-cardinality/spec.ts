import {ViewSpec} from '../../../types/view-spec.ts';
import {Ability, Area, Scope, deductCompatible} from 'edugraph-ts';
import { ConfigFromSchema } from '../../../types/schema.ts';
import { resolveRangeFromLabels } from '../../../lib/ontology.ts';
import { extractFirstMatch } from '../../../lib/resolvers.ts';

export const spec: ViewSpec = {
    viewId: 'counting-objects-cardinality',
    generalLabels: [
        Area.Numeration,
        Area.NumericIdentity,
        Scope.PhysicalNumbers,
        Scope.AdditiveCount,
        Scope.ArabicNumerals,
        Ability.ProcedureUnderstanding
    ]
};

export const CountingObjectsCardinalityViewSchema = {
    arrangement: extractFirstMatch([
        Scope.LinearArrangement,
        Scope.CircularArrangement,
        Scope.ScatteredArrangement
    ], Scope.ScatteredArrangement)
} as const;

export type CountingObjectsCardinalityViewConfig = ConfigFromSchema<typeof CountingObjectsCardinalityViewSchema>;
