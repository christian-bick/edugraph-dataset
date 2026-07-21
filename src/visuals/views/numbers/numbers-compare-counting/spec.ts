import {ViewSpec} from '../../../../types/view-spec.ts';
import {Ability, Scope} from 'edugraph-ts';
import { ConfigFromSchema } from '../../../../types/schema.ts';

export const spec: ViewSpec = {
    viewId: 'numbers-compare-counting',
    generalLabels: [
        Scope.PhysicalNumbers,
        Ability.ProcedureExecution,
        Scope.ArabicNumerals
    ]
};


export const NumbersCompareCountingViewSchema = {
    // TODO: add ontological relations where beneficial
} as const;

export type NumbersCompareCountingViewConfig = ConfigFromSchema<typeof NumbersCompareCountingViewSchema>;
