import {renderToStaticMarkup} from 'react-dom/server';
import {afterAll, beforeAll, describe, expect, it, vi} from 'vitest';
import {getRandomState} from '../../../../lib/random.ts';
import type {ViewRenderPayload} from '../../../../types/ml-engine.ts';
import type {GenericUnitCountRelationProblem} from '../../../../types/problems.ts';

const nativeRoot = vi.hoisted(() => ({createRoot: vi.fn(), render: vi.fn()}));
vi.mock('react-dom/client', () => ({createRoot: nativeRoot.createRoot}));

let Core: typeof import('./view.tsx').MeasureUnitScaleRelationCore;
beforeAll(async () => {
    vi.stubGlobal('window', {});
    nativeRoot.createRoot.mockReturnValue({render: nativeRoot.render});
    Core = (await import('./view.tsx')).MeasureUnitScaleRelationCore;
});
afterAll(() => vi.unstubAllGlobals());

function render(data: GenericUnitCountRelationProblem, isSolutionView: boolean): string {
    return renderToStaticMarkup(<Core config={{}} payload={{problem: {type: 'measurement', data, labels: []},
        viewId: 'measure-unit-scale-relation', targetLabels: [], isSolutionView, seed: 19}} />);
}

describe('generic unit count comparison projection', () => {
    it.each([3, 4, 5, 6])('preserves the same-length task for %i large units and both native counts', largeUnitCount => {
        for (const factor of [2, 3]) {
            const smallUnitCount = largeUnitCount * factor;
            const data = {kind: 'generic-unit-count-relation' as const, largeUnitCount, smallUnitCount};
            const question = render(data, false), solution = render(data, true);
            expect(question).toContain('Which unit size needs more units to cover the same length?');
            expect(question).not.toContain('Smaller units need a larger count:');
            expect(question.match(/<span\b/g)).toHaveLength(largeUnitCount + smallUnitCount);
            expect(solution).toContain(`Smaller units need a larger count: ${smallUnitCount} &gt; ${largeUnitCount}.`);
            expect(solution).not.toContain('×');
            expect(solution).not.toContain('scale factor');
            expect(render(data, false)).toBe(question);
        }
    });

    it('rejects wrong families, smuggled factors and unsafe or nonnative count relations before drawing', () => {
        const valid = {kind: 'generic-unit-count-relation' as const, largeUnitCount: 4, smallUnitCount: 8};
        for (const data of [null, {}, {largeUnitCount: 4, smallUnitCount: 8, unitsPerLarge: 2},
            {...valid, unitsPerLarge: 2}, {...valid, unitsPerLarge: undefined}, {...valid, kind: 'other'},
            {...valid, largeUnitCount: 2}, {...valid, largeUnitCount: 7}, {...valid, largeUnitCount: 3.5},
            {...valid, largeUnitCount: Number.MAX_SAFE_INTEGER + 1}, {...valid, smallUnitCount: 9},
            {...valid, smallUnitCount: -8}, {...valid, smallUnitCount: 8.5}, {...valid, smallUnitCount: Infinity}])
            expect(() => render(data as never, false)).toThrow();
    });

    it('mounts the prepared native entry point once and reuses its root across both task modes', () => {
        const container = {};
        const getElementById = vi.fn().mockReturnValueOnce(null).mockReturnValue(container);
        vi.stubGlobal('document', {getElementById});
        const markup: string[] = [];
        nativeRoot.render.mockImplementation(element => { markup.push(renderToStaticMarkup(element)); });
        const data: GenericUnitCountRelationProblem = {kind: 'generic-unit-count-relation', largeUnitCount: 5, smallUnitCount: 10};
        const payload: ViewRenderPayload<'measure-unit-scale-relation'> = {
            problem: {type: 'measurement', data, labels: []}, viewId: 'measure-unit-scale-relation',
            targetLabels: [], isSolutionView: false, seed: 19,
            preparedView: {version: 1, viewId: 'measure-unit-scale-relation', planHash: 'entry-plan',
                variantHash: 'entry-variant', config: {}, labels: [], randomState: 47}
        };

        window.renderView!(payload);
        expect(nativeRoot.createRoot).not.toHaveBeenCalled();
        expect(nativeRoot.render).not.toHaveBeenCalled();

        window.renderView!(payload);
        window.renderView!({...payload, isSolutionView: true});
        expect(getElementById.mock.calls).toEqual([['view'], ['view'], ['view']]);
        expect(nativeRoot.createRoot).toHaveBeenCalledExactlyOnceWith(container);
        expect(nativeRoot.render).toHaveBeenCalledTimes(2);
        expect(markup).toEqual([render(data, false), render(data, true)]);
        expect(markup[0]).toContain('Which unit size needs more units to cover the same length?');
        expect(markup[0]).not.toContain('Smaller units need a larger count:');
        expect(markup[1]).toContain('Smaller units need a larger count: 10 &gt; 5.');
        expect(markup.join('')).not.toMatch(/×|scale factor/);
        expect(getRandomState()).toBe(47);
    });
});
