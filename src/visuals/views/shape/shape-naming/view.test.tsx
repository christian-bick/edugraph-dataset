import {renderToStaticMarkup} from 'react-dom/server';
import {describe, expect, it} from 'vitest';
import {ViewRenderPayload} from '../../../../types/ml-engine.ts';
import {ShapeNamingProblem} from '../../../../types/problems.ts';
import {ShapeNamingCore} from './view.tsx';

const payload = (data: ShapeNamingProblem, seed: number, isSolutionView: boolean): ViewRenderPayload<'shape-naming'> => ({
    problem: {type: 'shape', data, labels: []},
    viewId: 'shape-naming',
    targetLabels: [],
    isSolutionView,
    seed
});

describe('shape-naming view', () => {
    it('renders the same shape at two deterministic sizes and rotations', () => {
        const data: ShapeNamingProblem = {shape: 'square'};
        const markup = renderToStaticMarkup(<ShapeNamingCore
            config={{varyOrientation: true, varySize: true}}
            payload={payload(data, 42, false)}
        />);
        const sizes = [...markup.matchAll(/data-shape-size="(\d+)"/g)].map(match => Number(match[1]));
        const rotations = [...markup.matchAll(/data-shape-rotation="(-?\d+)"/g)].map(match => Number(match[1]));

        expect(sizes).toHaveLength(2);
        expect(Math.abs(sizes[0] - sizes[1])).toBeGreaterThanOrEqual(28);
        expect(new Set(rotations).size).toBe(2);
        expect(markup).not.toContain('border-green-600');
    });

    it('reveals only the correct name in Solution Mode', () => {
        const data: ShapeNamingProblem = {shape: 'sphere'};
        const solution = renderToStaticMarkup(<ShapeNamingCore
            config={{varyOrientation: false, varySize: false}}
            payload={payload(data, 7, true)}
        />);
        expect(solution).toContain('Sphere');
        expect(solution.match(/border-green-600/g)).toHaveLength(1);
    });

    it('derives visible attribute text from a typed definition', () => {
        const data: ShapeNamingProblem = {
            shape: 'rhombus',
            definition: {
                sideCount: 4,
                vertexCount: 4,
                closed: true,
                boundary: 'straight',
                equalSides: true
            }
        };
        const markup = renderToStaticMarkup(<ShapeNamingCore
            config={{varyOrientation: false, varySize: false}}
            payload={payload(data, 7, false)}
        />);
        expect(markup).toContain('4 straight sides');
        expect(markup).toContain('4 equal sides');
    });

    it.each([
        {shape: 'star'},
        {shape: ''}
    ])('rejects an unsupported naming payload %#', data => {
        expect(() => renderToStaticMarkup(
            <ShapeNamingCore
                config={{varyOrientation: false, varySize: false}}
                payload={payload(data as ShapeNamingProblem, 3, false)}
            />
        )).toThrow();
    });
});
