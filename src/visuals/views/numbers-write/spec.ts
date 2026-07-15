import { ViewSpec, limitsAndMean, allOptions } from '../../../types/view-spec.ts';

export const spec: ViewSpec = {
    viewId: 'numbers-write',
    constraints: {
        number: { type: 'range', min: 0, max: 20 },
        outline: { type: 'options', values: [true, false] },
        mode: { type: 'options', values: ['stroke', 'count-objects'] }
    },
    testParams: {
        number: (c) => limitsAndMean(c),
        outline: (c) => allOptions(c),
        mode: (c) => allOptions(c)
    }
};
