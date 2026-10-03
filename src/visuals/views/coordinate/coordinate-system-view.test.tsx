import {renderToStaticMarkup} from 'react-dom/server';
import {afterAll, beforeAll, describe, expect, it, vi} from 'vitest';
import {CoordinateSystemGenerator} from '../../../generators/coordinate/coordinate-system/generator.ts';
import {setSeed} from '../../../lib/random.ts';
import type {ViewRenderPayload} from '../../../types/ml-engine.ts';
import type {CoordinateSystemProblem} from '../../../types/problems.ts';

const coordinateFixture: CoordinateSystemProblem = {
    kind: 'coordinate-system-foundations',
    origin: {x: 0, y: 0},
    rightAngleDegrees: 90,
    axes: {
        horizontal: {
            axisName: 'x', coordinateName: 'x', positiveUnitVector: {x: 1, y: 0},
            tickStep: 2, tickValues: [0, 2, 4, 6, 8, 10, 12]
        },
        vertical: {
            axisName: 'y', coordinateName: 'y', positiveUnitVector: {x: 0, y: 1},
            tickStep: 1, tickValues: [0, 1, 2, 3, 4, 5, 6, 7, 8]
        }
    },
    travel: {xUnits: 6, yUnits: 5}
};

let SpecificationCore: typeof import('./coordinate-system-specification/view.tsx').CoordinateSystemSpecificationCore;
let InterpretationCore: typeof import('./coordinate-components-interpretation/view.tsx').CoordinateComponentsInterpretationCore;
beforeAll(async () => {
    vi.stubGlobal('window', {});
    SpecificationCore = (await import('./coordinate-system-specification/view.tsx')).CoordinateSystemSpecificationCore;
    InterpretationCore = (await import('./coordinate-components-interpretation/view.tsx')).CoordinateComponentsInterpretationCore;
});
afterAll(() => vi.unstubAllGlobals());

const visible = (markup: string): string => markup.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ');

const renderSpecification = (data: CoordinateSystemProblem, isSolutionView: boolean): string => {
    const payload: ViewRenderPayload<'coordinate-system-specification'> = {
        problem: {type: 'shape', data, labels: []},
        viewId: 'coordinate-system-specification', targetLabels: [], isSolutionView, seed: 1
    };
    return renderToStaticMarkup(<SpecificationCore config={{}} payload={payload} />);
};

const renderInterpretation = (data: CoordinateSystemProblem, isSolutionView: boolean): string => {
    const payload: ViewRenderPayload<'coordinate-components-interpretation'> = {
        problem: {type: 'shape', data, labels: []},
        viewId: 'coordinate-components-interpretation', targetLabels: [], isSolutionView, seed: 1
    };
    return renderToStaticMarkup(<InterpretationCore config={{}} payload={payload} />);
};

describe('coordinate-system task projections', () => {
    it('leaves a real coordinate-system specification open, then completes it', () => {
        const q = renderSpecification(coordinateFixture, false);
        const s = renderSpecification(coordinateFixture, true);
        expect(visible(q)).toContain('Complete the coordinate frame');
        expect(q).toContain('>2</text>');
        expect(q).toContain('>1</text>');
        expect(q).toContain('>__</text>');
        expect(q).not.toContain('>x</text>');
        expect(q).not.toContain('>y</text>');
        expect(q).not.toContain('>0</text>');
        expect(visible(q)).toContain('First coordinate → ____ axis');
        expect(s).toContain('>x</text>');
        expect(s).toContain('>y</text>');
        expect(s).toContain('>0</text>');
        expect(s).toContain('>12</text>');
        expect(s).toContain('>8</text>');
        expect(visible(s)).toContain('First coordinate → horizontal x-axis');
        expect(visible(s)).toContain('Second coordinate → vertical y-axis');
    });

    it('asks for meanings, not point placement, and reveals origin-based axis distances', () => {
        const q = renderInterpretation(coordinateFixture, false);
        const s = renderInterpretation(coordinateFixture, true);
        expect(visible(q)).toContain('(6, 5)');
        expect(visible(q)).toContain('First component means:');
        expect(visible(q)).toContain('Second component means:');
        expect(visible(q)).not.toContain('Travel 6 units right');
        expect(q).not.toContain('data-coordinate-route');
        expect(q).not.toContain('<circle');
        expect(visible(q)).not.toMatch(/plot|mark the point/i);
        expect(s).toContain('data-route-leg="x"');
        expect(s).toContain('data-route-leg="y"');
        expect(s).toMatch(/data-route-leg="y"[^>]*x1="70"/);
        expect(visible(s)).toContain('Travel 6 units right from the origin along the horizontal x-axis');
        expect(visible(s)).toContain('Measured from the common zero, travel 5 units up along the vertical y-axis');
    });

    it('accepts zero-component axes and every generated payload in both leaves and modes', () => {
        for (const travel of [{xUnits: 0, yUnits: 5}, {xUnits: 6, yUnits: 0}, {xUnits: 0, yUnits: 0}]) {
            const data = {...coordinateFixture, travel};
            expect(() => renderInterpretation(data, true)).not.toThrow();
            expect(() => renderSpecification(data, false)).not.toThrow();
        }
        for (let seed = 0; seed < 50; seed++) {
            setSeed(`coordinate-system-view-${seed}`);
            const data = new CoordinateSystemGenerator().generate({}).data;
            for (const render of [renderSpecification, renderInterpretation]) {
                expect(() => render(data, false)).not.toThrow();
                expect(() => render(data, true)).not.toThrow();
            }
        }
    });

    it('rejects malformed scale or component data before either leaf renders', () => {
        const bad = {
            ...coordinateFixture,
            axes: {
                ...coordinateFixture.axes,
                horizontal: {...coordinateFixture.axes.horizontal, tickValues: [0, 2, 4, 7, 8]}
            }
        };
        for (const render of [renderSpecification, renderInterpretation]) {
            expect(() => render(bad, false)).toThrow(/Validation Error/);
            expect(() => render({...coordinateFixture, travel: {xUnits: 3, yUnits: 5}}, true)).toThrow(/Validation Error/);
        }
    });
});
