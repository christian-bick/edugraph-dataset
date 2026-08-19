import {renderToStaticMarkup} from 'react-dom/server';
import {describe, expect, it} from 'vitest';
import {ViewRenderPayload} from '../../../../types/ml-engine.ts';
import {ShapeClassifyDimProblem} from '../../../../types/problems.ts';
import {ShapeClassifyDimCore} from './view.tsx';

const payload = (data: ShapeClassifyDimProblem, isSolutionView: boolean): ViewRenderPayload<'shape-classify-dim'> => ({
    problem: {type: 'shape', data},
    viewId: 'shape-classify-dim',
    labels: [],
    isSolutionView,
    seed: 17
});

describe('shape-classify-dim view', () => {
    it('keeps both choices neutral in Question Mode and reveals the supplied classification in Solution Mode', () => {
        const data: ShapeClassifyDimProblem = {shape: 'cube', shapeType: '3d', answer: '3d'};
        const question = renderToStaticMarkup(<ShapeClassifyDimCore config={{}} payload={payload(data, false)} />);
        const solution = renderToStaticMarkup(<ShapeClassifyDimCore config={{}} payload={payload(data, true)} />);

        expect(question).toContain('Flat (2D)');
        expect(question).toContain('Solid (3D)');
        expect(question).not.toContain('border-green-600');
        expect(solution).toContain('border-green-600');
    });

    it.each([
        {shape: 'circle', shapeType: '3d', answer: '3d'},
        {shape: 'sphere', shapeType: '3d', answer: '2d'},
        {shape: 'star', shapeType: '2d', answer: '2d'}
    ])('rejects inconsistent or unsupported payload %#', data => {
        expect(() => renderToStaticMarkup(
            <ShapeClassifyDimCore config={{}} payload={payload(data as ShapeClassifyDimProblem, false)} />
        )).toThrow();
    });
});
