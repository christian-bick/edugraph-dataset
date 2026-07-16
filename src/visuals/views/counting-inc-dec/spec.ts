import {allOptions, ViewSpec} from '../../../types/view-spec.ts';
import {Scope} from 'edugraph-ts';

export const spec: ViewSpec = {
    viewId: 'counting-inc-dec',
    scopes: [Scope.SubtractiveCount, Scope.ArabicNumerals],
    constraints: {
        incDecType: { type: 'options', values: ['inc', 'dec'] }
    },
    testParams: {
        incDecType: (c) => allOptions(c),
        incDecAnswer: (key, params) => params.incDecType === 'inc' ? params.numObjects + 1 : params.numObjects - 1,
        simpleAnswer: (key, params) => params.numObjects
    }
};
