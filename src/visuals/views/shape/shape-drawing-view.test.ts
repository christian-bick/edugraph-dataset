import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {describe, expect, it} from 'vitest';
import {ViewRenderPayload} from '../../../types/ml-engine.ts';
import {ShapeBuildShapeProblem} from '../../../types/problems.ts';
import {getTracePath} from './shape-drawing-helpers.ts';
import {ShapeDrawingView} from './shape-drawing-view.tsx';

function renderDrawing(isSolutionView: boolean, data: ShapeBuildShapeProblem, seed = 27) {
    const circular = data.target === 'circle';
    const viewId = circular ? 'shape-draw-circular-shape' : 'shape-draw-linear-shape';
    const payload: ViewRenderPayload<typeof viewId> = {
        problem: {type: 'shape', data, labels: []},
        viewId,
        targetLabels: [],
        isSolutionView,
        seed
    };
    return renderToStaticMarkup(createElement(ShapeDrawingView, {
        expectedFamily: circular ? 'circular' : 'linear',
        payload,
        viewId
    }));
}

function svgFor(markup: string, label: string): string {
    const svg = markup.match(new RegExp(`<svg\\b[^>]*aria-label="${label}"[^>]*>[\\s\\S]*?<\\/svg>`));
    expect(svg, `Missing SVG: ${label}`).not.toBeNull();
    return svg![0];
}

const circle: ShapeBuildShapeProblem = {
    task: 'rotation-conservation',
    target: 'circle',
    sides: 0,
    corners: 0
};

describe('circle drawing rotation evidence', () => {
    it.each([false, true])('shows the marked circle turning in solution mode %s', isSolutionView => {
        const markup = renderDrawing(isSolutionView, circle);
        const reference = svgFor(markup, 'Reference circle');
        const rotated = reference.match(/<g transform="rotate\((\d+) 50 50\)">([\s\S]*?)<\/g>/);
        expect(rotated).not.toBeNull();
        expect(Number(rotated![1])).toBe(90);
        expect(rotated![2]).toContain(`d="${getTracePath('circle')}"`);
        expect(rotated![2]).toContain('<circle cx="50" cy="18" r="4.5"');
        expect(rotated![2]).toContain('aria-label="Boundary mark"');

        // The initial point stays at the top while the real boundary mark turns to the right.
        const outsideRotatedGroup = reference.replace(rotated![0], '');
        expect(outsideRotatedGroup).toContain('<circle cx="50" cy="18" r="4.5" fill="white"');
        expect(outsideRotatedGroup).toContain('aria-label="Mark before turning"');
        expect(outsideRotatedGroup).toContain('d="M 50 8 A 42 42 0 0 1 92 50 M 87 44 L 92 50 L 97 44"');
        expect(outsideRotatedGroup).toContain('aria-label="Clockwise turn"');
        expect(markup).not.toMatch(/90°|90 degrees/);
    });

    it('withholds the completed response in Question Mode', () => {
        const question = renderDrawing(false, circle);
        expect(question).toContain('Draw here');
        expect(question).not.toContain('Completed circle drawing');
        expect(question).not.toContain('forestgreen');
        expect(question.match(/<svg\b/g)).toHaveLength(1);
    });

    it('reveals a congruent complete circle with a distinct mark orientation in Solution Mode', () => {
        const solution = renderDrawing(true, circle);
        const completed = svgFor(solution, 'Completed circle drawing');
        expect(completed).toContain(`d="${getTracePath('circle')}"`);
        expect(completed).toContain('stroke="forestgreen"');
        expect(completed).toContain('<circle cx="50" cy="18" r="4.5" fill="forestgreen"');
        expect(completed).toContain('aria-label="Boundary mark"');
        expect(completed).not.toContain('transform=');
        expect(solution).not.toContain('Draw here');
        expect(solution.match(/<svg\b/g)).toHaveLength(2);
    });

    it('does not add circle turning marks to linear shapes or attribute construction', () => {
        const triangle = renderDrawing(true, {
            task: 'rotation-conservation', target: 'triangle', sides: 3, corners: 3
        });
        expect(triangle).toContain('rotate(180 50 50)');
        expect(triangle).not.toContain('Boundary mark');
        expect(triangle).not.toContain('Clockwise turn');

        const attributes = renderDrawing(true, {
            task: 'specify-attributes', target: 'circle', sides: 0, corners: 0,
            definition: {closed: true, boundary: 'curved', sideCount: 0, vertexCount: 0}
        });
        expect(attributes).toContain(`d="${getTracePath('circle')}"`);
        expect(attributes).not.toContain('Boundary mark');
        expect(attributes).not.toContain('Clockwise turn');
    });

    it('renders deterministically across repeated and interleaved calls', () => {
        const initial = renderDrawing(false, circle);
        renderDrawing(true, circle, 1001);
        expect(renderDrawing(false, circle)).toBe(initial);
    });
});
