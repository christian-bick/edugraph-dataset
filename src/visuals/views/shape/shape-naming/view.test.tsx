import {renderToStaticMarkup} from 'react-dom/server';
import {describe, expect, it} from 'vitest';
import {ViewRenderPayload} from '../../../../types/ml-engine.ts';
import {ShapeNamingProblem} from '../../../../types/problems.ts';
import {ShapeNamingCore} from './view.tsx';

const payload = (data: ShapeNamingProblem, seed: number, isSolutionView: boolean): ViewRenderPayload<'shape-naming'> => ({
    problem: {type: 'shape', data},
    viewId: 'shape-naming',
    labels: [],
    isSolutionView,
    seed
});

describe('shape-naming view', () => {
    it('renders the same shape at two deterministic sizes and rotations', () => {
        const data: ShapeNamingProblem = {shape: 'square', answer: 'square'};
        const markup = renderToStaticMarkup(<ShapeNamingCore config={{}} payload={payload(data, 42, false)} />);
        const sizes = [...markup.matchAll(/data-shape-size="(\d+)"/g)].map(match => Number(match[1]));
        const rotations = [...markup.matchAll(/data-shape-rotation="(-?\d+)"/g)].map(match => Number(match[1]));

        expect(sizes).toHaveLength(2);
        expect(Math.abs(sizes[0] - sizes[1])).toBeGreaterThanOrEqual(28);
        expect(new Set(rotations).size).toBe(2);
        expect(markup).not.toContain('border-green-600');
    });

    it('reveals only the correct name in Solution Mode', () => {
        const data: ShapeNamingProblem = {shape: 'sphere', answer: 'sphere'};
        const solution = renderToStaticMarkup(<ShapeNamingCore config={{}} payload={payload(data, 7, true)} />);
        expect(solution).toContain('Sphere');
        expect(solution.match(/border-green-600/g)).toHaveLength(1);
    });

    it.each([
        {shape: 'circle', answer: 'square'},
        {shape: 'star', answer: 'star'}
    ])('rejects an inconsistent or unsupported naming payload %#', data => {
        expect(() => renderToStaticMarkup(
            <ShapeNamingCore config={{}} payload={payload(data as ShapeNamingProblem, 3, false)} />
        )).toThrow();
    });
});
