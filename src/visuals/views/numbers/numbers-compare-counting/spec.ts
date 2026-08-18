import {ViewSpec} from '../../../../types/view-spec.ts';
import {Ability, Area, deductAdmitting, Scope} from 'edugraph-ts';
import { ConfigFromSchema } from '../../../../types/schema.ts';

export const spec: ViewSpec = {
    viewId: 'numbers-compare-counting',
    rejectedLabels: [
        ...deductAdmitting([Scope.NumbersLarger10])
    ],
    generalLabels: [
        Area.NumerationWithIntegers,
        Scope.AdditiveCount,
        Scope.PhysicalNumbers,
        Ability.ProcedureExecution
    ]
};


export const NumbersCompareCountingViewSchema = {
} as const;

export type NumbersCompareCountingViewConfig = ConfigFromSchema<typeof NumbersCompareCountingViewSchema>;
