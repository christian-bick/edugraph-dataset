import { ViewSpec, limitsAndMean, allOptions } from '../../../types/view-spec.ts';

export const spec: ViewSpec = {
    viewId: 'measure-length',
    constraints: {
        bandLength: { type: 'range', min: 5, max: 15 },
        reverse: { type: 'options', values: [true, false] },
        decimal: { type: 'options', values: [true, false] }
    },
    testParams: {
        bandLength: (c) => limitsAndMean(c),
        reverse: (c) => allOptions(c),
        decimal: (c) => allOptions(c),
        problemLength: (key, params) => params.bandLength - 2
    }
};
