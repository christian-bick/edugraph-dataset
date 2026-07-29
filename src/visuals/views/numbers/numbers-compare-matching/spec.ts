import {ViewSpec} from '../../../../types/view-spec.ts';
import {Ability, Area, deductAdmitting, Scope} from 'edugraph-ts';
import { ConfigFromSchema } from '../../../../types/schema.ts';

export const spec: ViewSpec = {
    viewId: 'numbers-compare-matching',
    rejectedLabels: [
        ...deductAdmitting([Scope.NumbersLarger10])
    ],
    generalLabels: [
        Area.SetComparison,
        Scope.PhysicalNumbers,
        Ability.ProcedureExecution
    ],
};


export const NumbersCompareMatchingViewSchema = {
} as const;

export type NumbersCompareMatchingViewConfig = ConfigFromSchema<typeof NumbersCompareMatchingViewSchema>;
