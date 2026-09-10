import {renderToStaticMarkup} from 'react-dom/server';
import {afterAll, beforeAll, describe, expect, it, vi} from 'vitest';
import {ShapeEdgeCompositionGenerator} from '../../../../generators/shape/shape-edge-composition/generator.ts';

let ShapeBuildFromParts: typeof import('./view.tsx')['ShapeBuildFromParts'];
beforeAll(async () => {
    vi.stubGlobal('window', {});
    ({ShapeBuildFromParts} = await import('./view.tsx'));
});
afterAll(() => vi.unstubAllGlobals());

const payloadFor = (data: ReturnType<ShapeEdgeCompositionGenerator['generate']>['data'], isSolutionView: boolean) => ({
    problem: {type: 'shape' as const, data, labels: []},
    targetLabels: [], viewId: 'shape-build-from-parts' as const, seed: 42, isSolutionView
});

describe('loose-part construction', () => {
    it.each(['triangle', 'square', 'rectangle', 'hexagon'] as const)('constructs %s only in Solution Mode', shape => {
        const {data} = new ShapeEdgeCompositionGenerator().generate({shape});
        const question = renderToStaticMarkup(<ShapeBuildFromParts payload={payloadFor(data, false)} />);
        const solution = renderToStaticMarkup(<ShapeBuildFromParts payload={payloadFor(data, true)} />);
        expect(question).toContain(`Use the loose sticks and corners to build a ${shape}.`);
        expect(question).toContain('Unassembled construction materials');
        expect(question).not.toContain('<polygon');
        expect(solution).toContain(`built from ${data.sides} sticks and ${data.corners} corners`);
        expect(solution).toContain('<polygon');
        expect(solution).not.toContain('Unassembled construction materials');
        expect(renderToStaticMarkup(<ShapeBuildFromParts payload={payloadFor(data, false)} />)).toBe(question);
    });

    it.each([
        {target: 'triangle', sides: 4, corners: 3},
        {target: 'hexagon', sides: 6, corners: 4},
        {target: 'circle', sides: 0, corners: 0},
        {target: 'triangle', corners: 3}
    ])('rejects incomplete or inconsistent composition evidence: %j', data => {
        expect(() => renderToStaticMarkup(<ShapeBuildFromParts payload={payloadFor(data as never, false)} />)).toThrow();
    });
});
