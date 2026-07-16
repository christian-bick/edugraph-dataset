import {allOptions, ViewSpec} from '../../../types/view-spec.ts';
import {Ability, Area, Scope} from 'edugraph-ts';

export const spec: ViewSpec = {
    viewId: 'numbers-compare',
    supportedLabels: [
        Scope.ArabicNumerals,
        Ability.ProcedureExecution
    ]
};
