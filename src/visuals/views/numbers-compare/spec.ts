import {ViewSpec} from '../../../types/view-spec.ts';
import {Ability, Scope} from 'edugraph-ts';
import { ConfigFromSchema } from '../../../types/schema.ts';

export const spec: ViewSpec = {
    viewId: 'numbers-compare',
    supportedLabels: [
        Scope.ArabicNumerals,
        Ability.ProcedureExecution
    ]
};

export const NumbersCompareGeneralLabels = [
    Scope.ArabicNumerals,
    Ability.ProcedureExecution
];

export const NumbersCompareViewSchema = {} as const;

export type NumbersCompareViewConfig = ConfigFromSchema<typeof NumbersCompareViewSchema>;
