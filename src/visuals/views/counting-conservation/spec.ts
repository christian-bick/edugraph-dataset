import { ViewSpec, limitsAndMean } from '../../../types/view-spec.ts';

export const spec: ViewSpec = {
    viewId: 'counting-conservation',
    constraints: {
        numObjects: { type: 'range', min: 1, max: 15 }
    },
    testParams: {
        numObjects: (c) => limitsAndMean(c)
    }
};
