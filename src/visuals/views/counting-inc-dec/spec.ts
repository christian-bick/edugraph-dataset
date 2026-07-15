import { ViewSpec, limitsAndMean, allOptions } from '../../../types/view-spec.ts';

export const spec: ViewSpec = {
    viewId: 'counting-inc-dec',
    constraints: {
        numObjects: { type: 'range', min: 1, max: 15 },
        incDecType: { type: 'options', values: ['inc', 'dec'] },
        arrangement: { type: 'options', values: ['line', 'circle', 'scattered', 'array'] }
    },
    testParams: {
        numObjects: (c) => limitsAndMean(c),
        incDecType: (c) => allOptions(c),
        arrangement: (c) => allOptions(c),
        layout: 'linear',
        incDecAnswer: (key, params) => params.incDecType === 'inc' ? params.numObjects + 1 : params.numObjects - 1,
        simpleAnswer: (key, params) => params.numObjects
    }
};
