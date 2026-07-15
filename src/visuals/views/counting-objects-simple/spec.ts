import { ViewSpec, limitsAndMean, allOptions } from '../../../types/view-spec.ts';

export const spec: ViewSpec = {
    viewId: 'counting-objects-simple',
    constraints: {
        numObjects: { type: 'range', min: 1, max: 20 },
        arrangement: { type: 'options', values: ['line', 'circle', 'scattered', 'array'] }
    },
    testParams: {
        numObjects: (c) => limitsAndMean(c),
        arrangement: (c) => allOptions(c)
    }
};
