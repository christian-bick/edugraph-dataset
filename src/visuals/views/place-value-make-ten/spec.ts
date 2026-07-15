import { ViewSpec, limitsAndMean } from '../../../types/view-spec.ts';

export const spec: ViewSpec = {
    viewId: 'place-value-make-ten',
    constraints: {
        givenNumber: { type: 'range', min: 1, max: 9 }
    },
    testParams: {
        givenNumber: (c) => limitsAndMean(c),
        missingNumber: (key, params) => 10 - params.givenNumber
    }
};
