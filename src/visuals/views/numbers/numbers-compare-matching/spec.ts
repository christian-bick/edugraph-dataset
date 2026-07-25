import {ViewSpec} from '../../../../types/view-spec.ts';
import {Ability, Scope} from 'edugraph-ts';
import { ConfigFromSchema } from '../../../../types/schema.ts';

export const spec: ViewSpec = {
    viewId: 'numbers-compare-matching',
    generalLabels: [
        Scope.PhysicalNumbers,
        Ability.ProcedureExecution,
        Scope.ArabicNumerals
    ],
};


export const NumbersCompareMatchingViewSchema = {
} as const;

export type NumbersCompareMatchingViewConfig = ConfigFromSchema<typeof NumbersCompareMatchingViewSchema>;
