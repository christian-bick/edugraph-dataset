import {renderToStaticMarkup} from 'react-dom/server';
import {afterAll, beforeAll, describe, expect, it, vi} from 'vitest';
import type {ComponentType} from 'react';
import type {ViewRenderPayload} from '../../../types/ml-engine.ts';
import type {ArithmeticProblem, ArithmeticTripleProblem} from '../../../types/problems.ts';
import {ArithmeticBoxesView} from './arithmetic-boxes-view.tsx';
import {ArithmeticVerticalView} from './arithmetic-vertical-view.tsx';
import {ArithmeticLawExercise} from './arithmetic-law-view.tsx';

const native = vi.hoisted(() => ({createRoot: vi.fn(), render: vi.fn()}));
vi.mock('react-dom/client', () => ({createRoot: native.createRoot}));
const ids = ['operations-boxes', 'operations-vertical', 'operations-boxes-inversion',
    'operations-vertical-inversion', 'operations-equal-addends-equation'] as const;
type ViewId = typeof ids[number];
const views = {} as Record<ViewId, ComponentType<{payload: ViewRenderPayload<any>}>>;
const dispatch = new Map<ViewId, (payload: ViewRenderPayload<any>) => void>();
const pair: ArithmeticProblem = {num1: 6, num2: 6, operation: 'addition', answer: 12};
const laws: ArithmeticTripleProblem[] = [
    {num1: 2, num2: 3, num3: 4, operation: 'addition', answer: 9, propertyLaw: 'commutative'},
    {num1: 2, num2: 3, num3: 4, operation: 'addition', answer: 9, propertyLaw: 'associative'},
    {num1: 7, num2: 13, num3: 1, operation: 'multiplication', answer: 98,
        propertyLaw: 'distributive', combinedFactor: 14, partialProducts: [91, 7]}
];

beforeAll(async () => {
    vi.stubGlobal('window', {});
    native.createRoot.mockReturnValue({render: native.render});
    views['operations-boxes'] = (await import('./operations-boxes/view.tsx')).OperationsBoxes;
    dispatch.set('operations-boxes', window.renderView!);
    views['operations-vertical'] = (await import('./operations-vertical/view.tsx')).OperationsVertical;
    dispatch.set('operations-vertical', window.renderView!);
    views['operations-boxes-inversion'] = (await import('./operations-boxes-inversion/view.tsx')).OperationsBoxesInversion;
    dispatch.set('operations-boxes-inversion', window.renderView!);
    views['operations-vertical-inversion'] = (await import('./operations-vertical-inversion/view.tsx')).OperationsVerticalInversion;
    dispatch.set('operations-vertical-inversion', window.renderView!);
    views['operations-equal-addends-equation'] = (await import('./operations-equal-addends-equation/view.tsx')).OperationsEqualAddendsEquation;
    dispatch.set('operations-equal-addends-equation', window.renderView!);
});
afterAll(() => vi.unstubAllGlobals());

function payload(viewId: ViewId, data: ArithmeticProblem, isSolutionView: boolean,
    config?: Record<string, unknown>): ViewRenderPayload<any> {
    const profile = data.propertyLaw === 'distributive' ? 'both-sides' : 'one-side';
    return {viewId, problem: {type: 'arithmetic', data, labels: []}, targetLabels: [], seed: 7, isSolutionView,
        preparedView: {version: 1, viewId, planHash: 'equation-contract', variantHash: 'equation-profile',
            randomState: 7, labels: [], config: config ?? (viewId.startsWith('operations-boxes') ? {equationShape: profile}
                : viewId.startsWith('operations-vertical') ? {presentation: data.propertyLaw ? `law-${profile}` : 'vertical'} : {})}};
}
function render(viewId: ViewId, data: ArithmeticProblem, solution: boolean, config?: Record<string, unknown>) {
    const View = views[viewId];
    return renderToStaticMarkup(<View payload={payload(viewId, data, solution, config)} />);
}

describe('equation view projection contracts', () => {
    it.each(laws)('preserves byte-identical shared $propertyLaw execution markup in both modes', data => {
        for (const solution of [false, true]) {
            const expected = renderToStaticMarkup(<ArithmeticLawExercise data={data} unknown="solution" isSolutionView={solution} />);
            for (const viewId of ['operations-boxes', 'operations-vertical'] as const) {
                expect(render(viewId, data, solution)).toBe(expected);
            }
            const inverted = renderToStaticMarkup(<ArithmeticLawExercise data={data} unknown="num2" isSolutionView={solution} />);
            for (const viewId of ['operations-boxes-inversion', 'operations-vertical-inversion'] as const) {
                expect(render(viewId, data, solution)).toBe(inverted);
            }
        }
    });

    it.each<ArithmeticProblem>([
        {num1: 4, num2: 0, operation: 'addition', answer: 4},
        {num1: 12, num2: 5, operation: 'subtraction', answer: 7},
        {num1: 3, num2: 4, operation: 'multiplication', answer: 12},
        {num1: 12, num2: 3, operation: 'division', answer: 4},
        {num1: 2, num2: 3, num3: 4, operation: 'addition', answer: 9},
        {num1: 2, num2: 3, num3: 4, num4: 5, operation: 'multiplication', answer: 120},
        pair
    ])('retains ordinary full-union execution and inversion for $operation', data => {
        for (const solution of [false, true]) {
            const boxed = render('operations-boxes', data, solution);
            const vertical = render('operations-vertical', data, solution);
            const input = payload('operations-boxes', data, solution);
            const invertedBox = renderToStaticMarkup(<ArithmeticBoxesView invertProcedure equationShape="one-side" payload={input} />);
            const invertedVertical = renderToStaticMarkup(<ArithmeticVerticalView invertProcedure presentation="vertical" payload={input as never} />);
            for (const markup of [boxed, vertical, invertedBox, invertedVertical]) {
                expect(markup).not.toMatch(/Rendering Error|NaN|undefined/);
            }
            expect(boxed).toContain('=');
            expect(vertical).toContain('bg-neutral-800');
            expect(vertical.includes('aria-label="unknown value"')).toBe(!solution);
            expect(invertedVertical.includes('aria-label="unknown value"')).toBe(!solution);
            if (data.operation === 'addition' && data.num1 === data.num2 && data.num3 === undefined) {
                expect(boxed).toContain('Repeated addition: the same addend is used twice.');
            }
        }
    });

    it('rejects forged prepared profiles and malformed arithmetic before showing a task', () => {
        expect(() => render('operations-boxes', pair, false, {})).toThrow('equationShape');
        expect(() => render('operations-vertical', pair, false, {})).toThrow('presentation');
        expect(() => render('operations-boxes', pair, false, {equationShape: 'both-sides'})).toThrow('must agree');
        expect(() => render('operations-vertical', laws[2], false, {presentation: 'vertical'})).toThrow('must agree');
        for (const data of [{...pair, operation: 'invalid'}, {...pair, answer: undefined}, {...pair, num4: 2},
            {...pair, num3: 2, num2: undefined}]) {
            for (const viewId of ['operations-boxes', 'operations-vertical'] as const) {
                expect(() => render(viewId, data as never, false)).toThrow(/Validation Error/);
            }
        }
    });

    it.each(ids)('%s mounts once and forwards Question/Solution through its native entry point', viewId => {
        const container = {}, getElementById = vi.fn().mockReturnValueOnce(null).mockReturnValue(container);
        vi.stubGlobal('document', {getElementById});
        native.createRoot.mockClear();native.render.mockClear();
        const markup: string[] = [];
        native.render.mockImplementation(element => markup.push(renderToStaticMarkup(element)));
        const question = payload(viewId, pair, false), solution = payload(viewId, pair, true);
        const invoke = dispatch.get(viewId)!;
        invoke(question);
        expect(native.createRoot).not.toHaveBeenCalled();
        expect(native.render).not.toHaveBeenCalled();
        invoke(question);invoke(solution);
        expect(native.createRoot).toHaveBeenCalledExactlyOnceWith(container);
        expect(native.render).toHaveBeenCalledTimes(2);
        expect(native.render.mock.calls[0][0].type).toBe(views[viewId]);
        expect(native.render.mock.calls[1][0].props.payload).toBe(solution);
        expect(markup).toEqual([render(viewId, pair, false), render(viewId, pair, true)]);
    });
});
