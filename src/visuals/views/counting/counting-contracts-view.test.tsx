import type {ComponentType} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {afterAll, beforeAll, describe, expect, it, vi} from 'vitest';
import {Scope} from 'edugraph-ts';
import type {ViewRenderPayload} from '../../../types/ml-engine.ts';
import {ViewValidationError} from '../../helpers/validation.ts';

const nativeRoot = vi.hoisted(() => ({createRoot: vi.fn(), render: vi.fn()}));
vi.mock('react-dom/client', () => ({createRoot: nativeRoot.createRoot}));

const enumerationViews = ['counting-objects-simple', 'counting-objects-one-to-one', 'counting-objects-cardinality'] as const;
const viewIds = [...enumerationViews, 'counting-conservation'] as const;
type ViewId = typeof viewIds[number];
let views: Record<ViewId, ComponentType<{payload: ViewRenderPayload<any>}>>;
const registrations = new Map<ViewId, (payload: ViewRenderPayload<any>) => void>();

const enumeration = {kind: 'counting-enumeration' as const, numObjects: 6, simpleAnswer: 6,
    countingNumbers: [1, 2, 3, 4, 5, 6], parity: 'even' as const};
const total = {kind: 'counting-total' as const, numObjects: 6, simpleAnswer: 6, parity: 'even' as const};
const fixtureFor = (viewId: ViewId) => viewId === 'counting-conservation' ? total : enumeration;

beforeAll(async () => {
    vi.stubGlobal('window', {});
    nativeRoot.createRoot.mockReturnValue({render: nativeRoot.render});
    const simple = await import('./counting-objects-simple/view.tsx');
    registrations.set('counting-objects-simple', window.renderView!);
    const oneToOne = await import('./counting-objects-one-to-one/view.tsx');
    registrations.set('counting-objects-one-to-one', window.renderView!);
    const cardinality = await import('./counting-objects-cardinality/view.tsx');
    registrations.set('counting-objects-cardinality', window.renderView!);
    const conservation = await import('./counting-conservation/view.tsx');
    registrations.set('counting-conservation', window.renderView!);
    views = {'counting-objects-simple': simple.CountingObjectsSimple,
        'counting-objects-one-to-one': oneToOne.CountingObjectsOneToOne,
        'counting-objects-cardinality': cardinality.CountingObjectsCardinality,
        'counting-conservation': conservation.CountingConservation};
});
afterAll(() => vi.unstubAllGlobals());

function payloadFor(viewId: ViewId, data: unknown, isSolutionView: boolean,
    arrangement: unknown = Scope.LinearArrangement): ViewRenderPayload<any> {
    return {viewId, problem: {type: 'counting', data, labels: []},
        targetLabels: [], seed: 7, isSolutionView, preparedView: {
            version: 1, viewId, planHash: 'counting-contract-fixture', variantHash: 'linear-fixture',
            config: viewId === 'counting-conservation' ? {} : {arrangement},
            labels: [], randomState: 7
        }};
}

function render(viewId: ViewId, data: unknown, isSolutionView: boolean,
    arrangement: unknown = Scope.LinearArrangement): string {
    const View = views[viewId];
    return renderToStaticMarkup(<View payload={payloadFor(viewId, data, isSolutionView, arrangement)} />);
}

describe('public counting projection validation', () => {
    it.each(viewIds)('%s rejects the opposite mathematical family in both modes', viewId => {
        const wrongFamily = viewId === 'counting-conservation' ? enumeration : total;
        const expectedKind = viewId === 'counting-conservation' ? 'counting-total' : 'counting-enumeration';
        for (const solution of [false, true]) {
            // React server rendering propagates child errors through ErrorBoundary.
            expect(() => render(viewId, wrongFamily, solution)).toThrow(ViewValidationError);
            expect(() => render(viewId, wrongFamily, solution)).toThrow(`A ${expectedKind} payload is required.`);
        }
    });

    it.each(viewIds)('%s rejects missing or inconsistent cardinality evidence in both modes', viewId => {
        const fixture = fixtureFor(viewId);
        const invalid = [null, {}, {...fixture, numObjects: 0}, {...fixture, numObjects: 1.5},
            {...fixture, numObjects: Infinity}, {...fixture, simpleAnswer: undefined},
            {...fixture, simpleAnswer: 7}, {...fixture, parity: 'odd'}, {...fixture, parity: 'any'}];
        for (const data of invalid) for (const solution of [false, true]) {
            expect(() => render(viewId, data, solution)).toThrow(ViewValidationError);
        }
    });

    it.each(enumerationViews)('%s requires a dense complete 1..N witness in both modes', viewId => {
        const sparse = Object.assign(new Array<number>(6), {0: 1, 1: 2, 3: 4, 4: 5, 5: 6});
        const invalid = [undefined, [], [1, 2, 3, 4, 5], [1, 2, 3, 4, 5, 6, 7],
            [0, 1, 2, 3, 4, 5], [1, 2, 2, 4, 5, 6], [1, 2, 4, 3, 5, 6], sparse];
        for (const countingNumbers of invalid) for (const solution of [false, true]) {
            expect(() => render(viewId, {...enumeration, countingNumbers}, solution)).toThrow(ViewValidationError);
        }
    });

    it.each([
        {name: 'own sequence', data: {...total, countingNumbers: [1, 2, 3, 4, 5, 6]}},
        {name: 'own undefined sequence', data: {...total, countingNumbers: undefined}},
        {name: 'inherited sequence', data: Object.assign(Object.create({countingNumbers: [1, 2, 3, 4, 5, 6]}), total)},
        {name: 'inherited undefined sequence', data: Object.assign(Object.create({countingNumbers: undefined}), total)}
    ])('counting-conservation rejects a total with $name in both modes', ({data}) => {
        for (const solution of [false, true]) {
            expect(() => render('counting-conservation', data, solution)).toThrow(ViewValidationError);
            expect(() => render('counting-conservation', data, solution))
                .toThrow('A counting-total payload must not contain an enumeration witness.');
        }
    });

    it('counting-objects-simple rejects an unsupported prepared arrangement in both modes', () => {
        for (const solution of [false, true]) {
            expect(() => render('counting-objects-simple', enumeration, solution, 'unsupported'))
                .toThrow(ViewValidationError);
            expect(() => render('counting-objects-simple', enumeration, solution, 'unsupported'))
                .toThrow('Unsupported object arrangement.');
        }
    });

    it.each(viewIds)('%s registers an entry point that mounts once and forwards the latest task mode', viewId => {
        const container = {}, getElementById = vi.fn().mockReturnValueOnce(null).mockReturnValue(container);
        vi.stubGlobal('document', {getElementById});
        nativeRoot.createRoot.mockClear();
        nativeRoot.render.mockClear();
        const markup: string[] = [];
        nativeRoot.render.mockImplementation(element => {markup.push(renderToStaticMarkup(element));});
        const dispatch = registrations.get(viewId)!;
        const data = fixtureFor(viewId), question = payloadFor(viewId, data, false), solution = payloadFor(viewId, data, true);

        dispatch(question);
        expect(nativeRoot.createRoot).not.toHaveBeenCalled();
        expect(nativeRoot.render).not.toHaveBeenCalled();

        dispatch(question);
        dispatch(solution);
        expect(nativeRoot.createRoot).toHaveBeenCalledExactlyOnceWith(container);
        expect(nativeRoot.render).toHaveBeenCalledTimes(2);
        expect(nativeRoot.render.mock.calls[0][0].type).toBe(views[viewId]);
        expect(nativeRoot.render.mock.calls[0][0].props.payload).toBe(question);
        expect(nativeRoot.render.mock.calls[1][0].props.payload).toBe(solution);
        expect(markup).toEqual([render(viewId, data, false), render(viewId, data, true)]);

        getElementById.mockReturnValue(null);
        dispatch(question);
        expect(getElementById.mock.calls).toEqual([['view'], ['view'], ['view'], ['view']]);
        expect(nativeRoot.createRoot).toHaveBeenCalledOnce();
        expect(nativeRoot.render).toHaveBeenCalledTimes(2);
    });
});
