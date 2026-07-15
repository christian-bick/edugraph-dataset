import { ViewSpec, allOptions } from '../../../types/view-spec.ts';

export const spec: ViewSpec = {
    viewId: 'numbers-order',
    constraints: {
        desc: { type: 'options', values: [true, false] }
    },
    testParams: {
        desc: (c) => allOptions(c),
        numbers: () => [3, 1, 4, 2]
    }
};
