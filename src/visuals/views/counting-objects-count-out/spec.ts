import { ViewSpec, limitsAndMean, allOptions } from '../../../types/view-spec.ts';

export const spec: ViewSpec = {
    viewId: 'counting-objects-count-out',
    constraints: {
        numObjects: { type: 'range', min: 1, max: 17 },
        arrangement: { type: 'options', values: ['line', 'circle', 'scattered', 'array'] }
    },
    testParams: {
        numObjects: (c) => limitsAndMean(c),
        arrangement: (c) => allOptions(c),
        mode: 'count-out',
        totalCount: (key, params) => params.numObjects + 3
    }
};
