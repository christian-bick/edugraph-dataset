import {renderToStaticMarkup} from 'react-dom/server';
import {describe, expect, it} from 'vitest';
import {ViewRenderPayload} from '../../../../types/ml-engine.ts';
import {ShapeCompareAttributesProblem} from '../../../../types/problems.ts';
import {ShapeCompareAttributesCore} from './view.tsx';

const data: ShapeCompareAttributesProblem = {
    dimension: '2d',
    attribute: 'vertices',
    shapes: [
        {shape: 'triangle', count: 3},
        {shape: 'hexagon', count: 6}
    ],
    relation: 'more',
    answer: 'hexagon'
};

function payload(problemData: ShapeCompareAttributesProblem, isSolutionView: boolean): ViewRenderPayload<'shape-compare-attributes'> {
    return {
        problem: {type: 'shape', data: problemData, labels: []},
        viewId: 'shape-compare-attributes',
        targetLabels: [],
        isSolutionView,
        seed: 31
    };
}

describe('shape-compare-attributes view', () => {
    it('shows authored counts neutrally in Question Mode and resolves the supplied evidence in Solution Mode', () => {
        const question = renderToStaticMarkup(
            <ShapeCompareAttributesCore config={{}} payload={payload(data, false)}/>
        );
        const solution = renderToStaticMarkup(
            <ShapeCompareAttributesCore config={{}} payload={payload(data, true)}/>
        );

        expect(question).toContain('3 vertices');
        expect(question).toContain('6 vertices');
        expect(question).not.toContain('border-emerald-500');
        expect(question).not.toContain('6 &gt; 3');
        expect(solution).toContain('border-emerald-500');
        expect(solution).toContain('6 &gt; 3');
        expect(solution).toContain('Hexagon has more vertices');
    });

    it('renders supported solid shapes from the same strict payload contract', () => {
        const solid: ShapeCompareAttributesProblem = {
            dimension: '3d',
            attribute: 'faces',
            shapes: [{shape: 'cone', count: 1}, {shape: 'cube', count: 6}],
            relation: 'more',
            answer: 'cube'
        };
        const markup = renderToStaticMarkup(
            <ShapeCompareAttributesCore config={{}} payload={payload(solid, false)}/>
        );

        expect(markup).toContain('Cone');
        expect(markup).toContain('Cube');
        expect(markup).toContain('1 flat face');
        expect(markup).toContain('6 flat faces');
    });
});
