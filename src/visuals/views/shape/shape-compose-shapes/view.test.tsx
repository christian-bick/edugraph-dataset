import {renderToStaticMarkup} from 'react-dom/server';
import {describe, expect, it} from 'vitest';
import {ViewRenderPayload} from '../../../../types/ml-engine.ts';
import {ShapeComposeShapesProblem} from '../../../../types/problems.ts';
import {ShapeComposeShapesCore} from './view.tsx';

const data: ShapeComposeShapesProblem = {
    compositionTree: {
        kind: 'composite',
        shape: 'rectangle',
        inputs: [
            {kind: 'primitive', shape: 'triangle'},
            {kind: 'primitive', shape: 'triangle'}
        ]
    },
    compositionDepth: 1
};

const payload = (isSolutionView: boolean, seed = 42): ViewRenderPayload<'shape-compose-shapes'> => ({
    problem: {type: 'shape', data, labels: []},
    viewId: 'shape-compose-shapes',
    targetLabels: [],
    isSolutionView,
    seed
});

describe('shape-compose-shapes view', () => {
    it('derives neutral choices in Question Mode and identifies the answer in Solution Mode', () => {
        const question = renderToStaticMarkup(
            <ShapeComposeShapesCore config={{}} payload={payload(false)} />
        );
        const solution = renderToStaticMarkup(
            <ShapeComposeShapesCore config={{}} payload={payload(true)} />
        );

        expect(question).toContain('Which pieces can you join to make a rectangle?');
        expect(question).toContain('Two triangles');
        expect(question).toContain('Two circles');
        expect(question).not.toContain('border-green-600');
        expect(solution.match(/border-green-600/g)).toHaveLength(1);
        expect(solution).toContain('stroke="#ef4444"');
    });

    it('uses the render-seed parity to vary the answer position', () => {
        const even = renderToStaticMarkup(
            <ShapeComposeShapesCore config={{}} payload={payload(false, 0)} />
        );
        const odd = renderToStaticMarkup(
            <ShapeComposeShapesCore config={{}} payload={payload(false, 1)} />
        );

        expect(even.indexOf('Two triangles')).toBeLessThan(even.indexOf('Two circles'));
        expect(odd.indexOf('Two circles')).toBeLessThan(odd.indexOf('Two triangles'));
    });
});
