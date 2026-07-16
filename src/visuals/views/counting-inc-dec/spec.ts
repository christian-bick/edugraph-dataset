import {ViewSpec} from '../../../types/view-spec.ts';
import {Scope} from 'edugraph-ts';

export const spec: ViewSpec = {
    viewId: 'counting-inc-dec',
    supportedLabels: [
        Scope.SubtractiveCount,
        Scope.ArabicNumerals
    ],
};
