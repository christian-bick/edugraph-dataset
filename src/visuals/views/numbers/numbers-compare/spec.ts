import {ViewSpec} from '../../../../types/view-spec.ts';
import {Ability, Scope} from 'edugraph-ts';
import { ConfigFromSchema } from '../../../../types/schema.ts';

export const spec: ViewSpec = {
    viewId: 'numbers-compare',
    generalLabels: [
        Scope.ArabicNumerals,
        Ability.ProcedureExecution
    ]
};


export const NumbersCompareViewSchema = {} as const;

export type NumbersCompareViewConfig = ConfigFromSchema<typeof NumbersCompareViewSchema>;
