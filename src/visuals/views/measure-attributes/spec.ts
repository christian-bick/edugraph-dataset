import { ViewSpec, allOptions } from '../../../types/view-spec.ts';

export const spec: ViewSpec = {
    viewId: 'measure-attributes',
    constraints: {
        attribute: { type: 'options', values: ['length', 'height', 'weight'] }
    },
    testParams: {
        attribute: (c) => allOptions(c),
        mode: 'attribute-type'
    }
};
