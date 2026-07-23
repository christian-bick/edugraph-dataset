import {ViewSpec} from '../../../../types/view-spec.ts';
import {Ability, Area, Scope} from 'edugraph-ts';
import { ConfigFromSchema } from '../../../../types/schema.ts';

export const spec: ViewSpec = {
    viewId: 'counting-objects-cardinality',
    generalLabels: [
        Area.NumericIdentity,
        Scope.PhysicalNumbers,
        Scope.ArabicNumerals,
        Ability.ProcedureUnderstanding
    ]
};

export const CountingObjectsCardinalityViewSchema = {
    arrangement: [Scope.LinearArrangement, Scope.CircularArrangement, Scope.ScatteredArrangement]
} as const;

export type CountingObjectsCardinalityViewConfig = ConfigFromSchema<typeof CountingObjectsCardinalityViewSchema>;
