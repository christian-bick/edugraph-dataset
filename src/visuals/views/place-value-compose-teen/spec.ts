import { ViewSpec, limitsAndMean } from '../../../types/view-spec.ts';

export const spec: ViewSpec = {
    viewId: 'place-value-compose-teen',
    constraints: {
        ones: { type: 'range', min: 0, max: 9 }
    },
    testParams: {
        ones: (c) => limitsAndMean(c),
        target: (key, params) => 10 + params.ones
    }
};
