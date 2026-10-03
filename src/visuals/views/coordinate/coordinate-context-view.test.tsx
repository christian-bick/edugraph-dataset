import {renderToStaticMarkup} from 'react-dom/server';
import {afterAll, beforeAll, describe, expect, it, vi} from 'vitest';
import {CoordinateContextGenerator} from '../../../generators/coordinate/coordinate-context/generator.ts';
import {setSeed} from '../../../lib/random.ts';
import type {ViewRenderPayload} from '../../../types/ml-engine.ts';
import type {ContextualCoordinateProblem} from '../../../types/problems.ts';

let PlottingCore: typeof import('./coordinate-context-plotting/view.tsx').CoordinateContextPlottingCore;
let InterpretationCore: typeof import('./coordinate-context-interpretation/view.tsx').CoordinateContextInterpretationCore;
beforeAll(async () => {
    vi.stubGlobal('window', {});
    PlottingCore = (await import('./coordinate-context-plotting/view.tsx')).CoordinateContextPlottingCore;
    InterpretationCore = (await import('./coordinate-context-interpretation/view.tsx')).CoordinateContextInterpretationCore;
});
afterAll(() => vi.unstubAllGlobals());

const fixture: ContextualCoordinateProblem = {
    kind: 'contextual-coordinate-locations',
    situation: {
        kind: 'park-map', originLandmark: 'park-gate',
        horizontalQuantity: {kind: 'eastward-distance', positiveDirection: 'east', unitId: 'block'},
        verticalQuantity: {kind: 'northward-distance', positiveDirection: 'north', unitId: 'block'}
    },
    locations: [
        {id: 'pond', xValue: 2, yValue: 5},
        {id: 'garden', xValue: 6, yValue: 3},
        {id: 'playground', xValue: 8, yValue: 7}
    ],
    referenceLocationId: 'garden'
};

const visible = (markup: string): string => markup.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ');
const svg = (markup: string): string => markup.match(/<svg[\s\S]*?<\/svg>/)?.[0] || '';

const renderPlot = (data: ContextualCoordinateProblem, isSolutionView: boolean): string => {
    const payload: ViewRenderPayload<'coordinate-context-plotting'> = {
        problem: {type: 'shape', data, labels: []}, viewId: 'coordinate-context-plotting',
        targetLabels: [], isSolutionView, seed: 1
    };
    return renderToStaticMarkup(<PlottingCore config={{}} payload={payload} />);
};
const renderInterpret = (data: ContextualCoordinateProblem, isSolutionView: boolean): string => {
    const payload: ViewRenderPayload<'coordinate-context-interpretation'> = {
        problem: {type: 'shape', data, labels: []}, viewId: 'coordinate-context-interpretation',
        targetLabels: [], isSolutionView, seed: 1
    };
    return renderToStaticMarkup(<InterpretationCore config={{}} payload={payload} />);
};

describe('contextual coordinate views', () => {
    it('uses all three descriptions as necessary plot inputs while Question grid stays empty', () => {
        const q = renderPlot(fixture, false);
        const s = renderPlot(fixture, true);
        const question = visible(q);
        expect(question).toContain('Pond is 2 blocks east and 5 blocks north');
        expect(question).toContain('Garden is 6 blocks east and 3 blocks north');
        expect(question).toContain('Playground is 8 blocks east and 7 blocks north');
        expect(question).toContain('park gate is the starting point');
        expect(question).not.toContain('(2, 5)');
        expect(svg(q)).not.toContain('<circle');
        expect(svg(q)).not.toContain('data-landmark-marker');
        for (const [id, pair] of [['pond', '(2, 5)'], ['garden', '(6, 3)'], ['playground', '(8, 7)']] as const) {
            expect(svg(s)).toContain(`data-landmark-marker="${id}"`);
            expect(visible(s)).toContain(pair);
        }
    });

    it('shows one selected point and pair, then explains both values from gate with block units', () => {
        const q = renderInterpret(fixture, false);
        const s = renderInterpret(fixture, true);
        expect(visible(q)).toContain('B = (6, 3)');
        expect(svg(q)).toContain('data-landmark-marker="garden"');
        expect(svg(q)).not.toContain('data-landmark-marker="pond"');
        expect(svg(q)).not.toContain('data-component-guides');
        expect(visible(q)).toContain('First component means:');
        expect(visible(q)).toContain('Second component means:');
        expect(visible(q)).not.toContain('measured from zero');
        expect(visible(q)).not.toMatch(/plot|mark the point/i);
        expect(svg(s)).toContain('data-component-axis="x"');
        expect(svg(s)).toContain('data-component-axis="y"');
        expect(svg(s)).toMatch(/data-component-axis="y"[^>]*x1="70"/);
        expect(visible(s)).toContain('garden is 6 blocks east of the park gate, measured from zero on the x-axis');
        expect(visible(s)).toContain('garden is 3 blocks north of the park gate, measured from zero on the y-axis');
    });

    it('accepts all three reference choices and generated examples in both modes', () => {
        for (const referenceLocationId of ['pond', 'garden', 'playground'] as const) {
            const data = {...fixture, referenceLocationId};
            for (const render of [renderPlot, renderInterpret]) {
                expect(() => render(data, false)).not.toThrow();
                expect(() => render(data, true)).not.toThrow();
            }
        }
        for (let seed = 0; seed < 40; seed++) {
            setSeed(`contextual-coordinate-view-${seed}`);
            const data = new CoordinateContextGenerator().generate({}).data;
            for (const render of [renderPlot, renderInterpret]) {
                expect(() => render(data, false)).not.toThrow();
                expect(() => render(data, true)).not.toThrow();
            }
        }
    });

    it('rejects contradictory context and duplicate or out-of-grid points', () => {
        const [pond, garden, playground] = fixture.locations;
        const invalid: ContextualCoordinateProblem[] = [
            {...fixture, situation: {...fixture.situation, verticalQuantity: {
                ...fixture.situation.verticalQuantity, positiveDirection: 'south' as 'north'
            }}},
            {...fixture, locations: [pond, {...garden, xValue: pond.xValue, yValue: pond.yValue}, playground]},
            {...fixture, locations: [pond, garden, {...playground, yValue: 9 as 8}]}
        ];
        for (const data of invalid) {
            for (const render of [renderPlot, renderInterpret]) {
                expect(() => render(data, false)).toThrow(/Validation Error/);
            }
        }
    });
});
