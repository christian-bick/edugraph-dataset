import { ViewSpec, allOptions } from '../../../types/view-spec.ts';

export const spec: ViewSpec = {
    viewId: 'geometry-viewer',
    constraints: {
        mode: { type: 'options', values: ['position', 'env-shapes', 'name-2d', 'name-3d', 'classify-dim', 'compare-attributes', 'same-attribute', 'build-shape', 'draw-shape', 'compose-shapes'] },
        relation: { type: 'options', values: ['above', 'below', 'beside', 'nextTo'] },
        shapeType: { type: 'options', values: ['2d', '3d'] }
    },
    testParams: {
        mode: (c) => allOptions(c),
        relation: (c) => allOptions(c),
        shapeType: (c) => allOptions(c),
        target: (key, params) => params.mode === 'env-shapes' ? 'clock' : 'triangle',
        shape: 'triangle',
        attribute: (key, params) => params.mode === 'same-attribute' ? 'can-roll' : 'sides',
        shape1: 'triangle',
        shape2: 'square',
        val1: 3,
        val2: 4,
        sides: 3,
        corners: 3,
        components: () => ['triangle', 'square'],
        answer: 'triangle'
    }
};
