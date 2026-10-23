import {resolve} from 'node:path';
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import {renderTasks, type RenderTask} from './render.ts';
import {RENDER_CONTEXT_OPTIONS} from './render-environment.ts';
import type {RenderPayload} from '../types/ml-engine.ts';

const mocks = vi.hoisted(() => ({
    launch: vi.fn(),
    capture: vi.fn(),
    exists: vi.fn(),
    mkdir: vi.fn()
}));

vi.mock('playwright', () => ({chromium: {launch: mocks.launch}}));
vi.mock('./capture-view.ts', () => ({captureViewScreenshot: mocks.capture}));
vi.mock('fs', () => ({existsSync: mocks.exists, mkdirSync: mocks.mkdir}));

function task(fileName: string, viewId: string, seed: number): RenderTask {
    return {
        fileName,
        viewId,
        payload: {
            problem: {type: 'counting', data: {count: seed}, labels: ['emitted-label']},
            viewId,
            targetLabels: ['target-label'],
            isSolutionView: seed % 2 === 0,
            seed
        }
    };
}

function runtime() {
    const renderView = vi.fn();
    const page = {
        goto: vi.fn(async () => {}),
        waitForFunction: vi.fn(async (predicate: () => unknown) => {
            if (!predicate()) throw new Error('Mocked renderer readiness was not satisfied.');
        }),
        addStyleTag: vi.fn(async () => {}),
        evaluate: vi.fn(async (render: (payload: RenderPayload) => void, payload: RenderPayload) => render(payload)),
        waitForTimeout: vi.fn(async (_milliseconds: number) => {})
    };
    const context = {newPage: vi.fn(async () => page), close: vi.fn(async () => {})};
    const browser = {newContext: vi.fn(async () => context), close: vi.fn(async () => {})};
    return {renderView, page, context, browser};
}

describe('renderTasks', () => {
    let renderer: ReturnType<typeof runtime>;
    const outDir = resolve('temp', 'mock-render-output');

    beforeEach(() => {
        vi.resetAllMocks();
        renderer = runtime();
        mocks.launch.mockResolvedValue(renderer.browser);
        mocks.capture.mockResolvedValue(undefined);
        mocks.exists.mockReturnValue(true);
        vi.stubGlobal('window', {renderView: renderer.renderView});
        vi.stubGlobal('document', {
            fonts: {status: 'loaded'},
            images: [{complete: true, naturalWidth: 24}]
        });
    });

    afterEach(() => vi.unstubAllGlobals());

    it('does no filesystem or browser work for an empty task list', async () => {
        expect(await renderTasks([], outDir, {})).toEqual([]);
        expect(mocks.exists).not.toHaveBeenCalled();
        expect(mocks.mkdir).not.toHaveBeenCalled();
        expect(mocks.launch).not.toHaveBeenCalled();
        expect(mocks.capture).not.toHaveBeenCalled();
    });

    it('renders sorted payloads with the explicit profile and reuses a shared view URL', async () => {
        mocks.exists.mockReturnValue(false);
        const tasks = [
            task('last.png', 'z-fallback', 4),
            task('second.png', 'a-view', 2),
            task('alias.png', 'b-alias', 3),
            task('first.png', 'a-view', 1)
        ];
        const originalOrder = [...tasks];
        const expectedOrder = [tasks[3], tasks[1], tasks[2], tasks[0]];
        const paths = expectedOrder.map(item => resolve(outDir, item.fileName));

        expect(await renderTasks(tasks, outDir, {
            'a-view': 'operations/shared',
            'b-alias': 'operations/shared'
        }, 'http://renderer.test:4173')).toEqual(paths);

        expect(tasks).toEqual(originalOrder);
        expect(mocks.mkdir).toHaveBeenCalledExactlyOnceWith(outDir, {recursive: true});
        expect(mocks.launch).toHaveBeenCalledExactlyOnceWith({headless: true});
        expect(renderer.browser.newContext).toHaveBeenCalledExactlyOnceWith(RENDER_CONTEXT_OPTIONS);
        expect(renderer.context.newPage).toHaveBeenCalledOnce();
        expect(renderer.page.goto.mock.calls).toEqual([
            ['http://renderer.test:4173/visuals/views/operations/shared/view.html', {waitUntil: 'networkidle', timeout: 15000}],
            ['http://renderer.test:4173/visuals/views/z-fallback/view.html', {waitUntil: 'networkidle', timeout: 15000}]
        ]);
        expect(renderer.page.addStyleTag).toHaveBeenCalledTimes(2);
        expect(renderer.page.addStyleTag).toHaveBeenCalledWith({
            content: '*, *::before, *::after { transition: none !important; animation: none !important; }'
        });
        expect(renderer.renderView.mock.calls.map(([payload]) => payload)).toEqual(expectedOrder.map(item => item.payload));
        expect(mocks.capture.mock.calls).toEqual(paths.map(path => [renderer.page, path]));
        expect(renderer.context.close).toHaveBeenCalledOnce();
        expect(renderer.browser.close).toHaveBeenCalledOnce();
        expect(renderer.context.close.mock.invocationCallOrder[0]).toBeLessThan(renderer.browser.close.mock.invocationCallOrder[0]);
    });

    it('awaits rendered font/image readiness and the settling delay before shared capture', async () => {
        const sample = task('ready.png', 'a-view', 1);
        let releaseReadiness!: () => void;
        let releaseDelay!: () => void;
        const readiness = new Promise<void>(resolveReady => { releaseReadiness = resolveReady; });
        const delay = new Promise<void>(resolveDelay => { releaseDelay = resolveDelay; });
        renderer.page.waitForFunction
            .mockImplementationOnce(async predicate => { expect(predicate()).toBe(true); })
            .mockImplementationOnce(async predicate => {
                expect(renderer.renderView).toHaveBeenCalledExactlyOnceWith(sample.payload);
                expect(predicate()).toBe(true);
                vi.stubGlobal('document', {fonts: {status: 'loading'}, images: []});
                expect(predicate()).toBe(false);
                vi.stubGlobal('document', {fonts: {status: 'loaded'}, images: [{complete: false, naturalWidth: 24}]});
                expect(predicate()).toBe(false);
                vi.stubGlobal('document', {fonts: {status: 'loaded'}, images: [{complete: true, naturalWidth: 0}]});
                expect(predicate()).toBe(false);
                vi.stubGlobal('document', {fonts: {status: 'loaded'}, images: [{complete: true, naturalWidth: 24}]});
                await readiness;
            });
        renderer.page.waitForTimeout.mockImplementation(async milliseconds => {
            expect(milliseconds).toBe(60);
            await delay;
        });

        const rendering = renderTasks([sample], outDir, {});
        await vi.waitFor(() => expect(renderer.page.waitForFunction).toHaveBeenCalledTimes(2));
        expect(mocks.capture).not.toHaveBeenCalled();
        expect(renderer.page.waitForTimeout).not.toHaveBeenCalled();
        releaseReadiness();
        await vi.waitFor(() => expect(renderer.page.waitForTimeout).toHaveBeenCalledOnce());
        expect(mocks.capture).not.toHaveBeenCalled();
        releaseDelay();
        expect(await rendering).toEqual([resolve(outDir, sample.fileName)]);
        expect(mocks.capture).toHaveBeenCalledExactlyOnceWith(renderer.page, resolve(outDir, sample.fileName));
    });

    it('propagates capture failure and closes the browser that owns the context', async () => {
        const failure = new Error('capture failed');
        mocks.capture.mockRejectedValueOnce(failure);
        const tasks = [task('first.png', 'a-view', 1), task('second.png', 'a-view', 2)];

        await expect(renderTasks(tasks, outDir, {})).rejects.toBe(failure);

        expect(mocks.capture).toHaveBeenCalledExactlyOnceWith(renderer.page, resolve(outDir, 'first.png'));
        expect(renderer.renderView).toHaveBeenCalledExactlyOnceWith(tasks[0].payload);
        expect(renderer.browser.close).toHaveBeenCalledOnce();
        expect(renderer.browser.close.mock.invocationCallOrder[0]).toBeGreaterThan(mocks.capture.mock.invocationCallOrder[0]);
    });

    it('closes the browser and gives a useful renderer URL when navigation fails', async () => {
        renderer.page.goto.mockRejectedValueOnce(new Error('connection refused'));

        await expect(renderTasks([task('first.png', 'a-view', 1)], outDir, {
            'a-view': 'operations/missing'
        }, 'http://renderer.test:4173')).rejects.toThrow(
            'Could not load http://renderer.test:4173/visuals/views/operations/missing/view.html'
        );

        expect(renderer.renderView).not.toHaveBeenCalled();
        expect(mocks.capture).not.toHaveBeenCalled();
        expect(renderer.browser.close).toHaveBeenCalledOnce();
    });
});
