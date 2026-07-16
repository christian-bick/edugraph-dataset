import { ViewSpec, limitsAndMean, allOptions } from '../../../types/view-spec.ts';
import { Scope } from 'edugraph-ts';

export const spec: ViewSpec = {
    viewId: 'counting-inc-dec',
    scopes: [Scope.SubtractiveCount, Scope.ArabicNumerals],
    constraints: {
        numObjects: { type: 'range', min: 1, max: 15 },
        incDecType: { type: 'options', values: ['inc', 'dec'] }
    },
    testParams: {
        numObjects: (c) => limitsAndMean(c),
        incDecType: (c) => allOptions(c),
        incDecAnswer: (key, params) => params.incDecType === 'inc' ? params.numObjects + 1 : params.numObjects - 1,
        simpleAnswer: (key, params) => params.numObjects
    }
};
