import {ViewSpec} from '../../../types/view-spec.ts';
import {Ability, Scope} from 'edugraph-ts';
import { ConfigFromSchema } from '../../../types/schema.ts';

export const spec: ViewSpec = {
    viewId: 'numbers-compare-counting',
    supportedLabels: [
        Scope.PhysicalNumbers,
        Ability.ProcedureExecution
    ]
};

export const NumbersCompareCountingGeneralLabels = [
    Scope.PhysicalNumbers,
    Ability.ProcedureExecution
];

export const NumbersCompareCountingViewSchema = {
    // TODO: add ontological relations where beneficial
} as const;

export type NumbersCompareCountingViewConfig = ConfigFromSchema<typeof NumbersCompareCountingViewSchema>;
