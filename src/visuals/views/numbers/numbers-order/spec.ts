import {ViewSpec} from '../../../../types/view-spec.ts';
import {Ability, Area, Scope} from 'edugraph-ts';
import { ConfigFromSchema } from '../../../../types/schema.ts';
import { hasLabel } from '../../../../lib/resolvers.ts';

export const spec: ViewSpec = {
    viewId: 'numbers-order',
    generalLabels: [
        Area.NumerationWithIntegers,
        Scope.ArabicNumerals,
        Ability.ProcedureExecution
    ]
};


export const NumbersOrderViewSchema = {
    isDesc: [
        [Scope.Most, Scope.Least],
        hasLabel(Scope.Most)
    ]
} as const;

export type NumbersOrderViewConfig = ConfigFromSchema<typeof NumbersOrderViewSchema>;
