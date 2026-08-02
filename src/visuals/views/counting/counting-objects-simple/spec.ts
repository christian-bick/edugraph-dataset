import {ViewSpec} from '../../../../types/view-spec.ts';
import {Ability, Scope} from 'edugraph-ts';
import { ConfigFromSchema } from '../../../../types/schema.ts';
import { hasLabel } from '../../../../lib/resolvers.ts';

export const spec: ViewSpec = {
    viewId: 'counting-objects-simple',
    generalLabels: [
        Scope.PhysicalNumbers,
        Scope.ArabicNumerals,
        Ability.ProcedureExecution,
        Ability.ProcedureUnderstanding
    ]
};


export const CountingObjectsSimpleViewSchema = {
    arrangement: [Scope.LinearArrangement, Scope.CircularArrangement, Scope.ScatteredArrangement],
    isBoxArrangement: [[Scope.BoxArrangement], hasLabel(Scope.BoxArrangement)]
} as const;

export type CountingObjectsSimpleViewConfig = ConfigFromSchema<typeof CountingObjectsSimpleViewSchema>;
