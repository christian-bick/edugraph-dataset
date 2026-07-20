import {ViewSpec} from '../../../types/view-spec.ts';
import {Ability, Area, Scope} from 'edugraph-ts';
import { ConfigFromSchema } from '../../../types/schema.ts';

export const spec: ViewSpec = {
    viewId: 'numbers-compare-matching',
    generalLabels: [
        Scope.PhysicalNumbers,
        Ability.ProcedureExecution,
        Scope.ArabicNumerals
    ],
};


export const NumbersCompareMatchingViewSchema = {
    // TODO: add ontological relations where beneficial
} as const;

export type NumbersCompareMatchingViewConfig = ConfigFromSchema<typeof NumbersCompareMatchingViewSchema>;
