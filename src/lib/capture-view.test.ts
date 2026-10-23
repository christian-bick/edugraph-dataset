import type {Page} from 'playwright';
import {afterEach, describe, expect, it, vi} from 'vitest';
import {captureViewScreenshot} from './capture-view.ts';
import {RENDER_CONTEXT_OPTIONS} from './render-environment.ts';

type Viewport = NonNullable<ReturnType<Page['viewportSize']>>;
type Bounds = {x: number; y: number; width: number; height: number};
type Observation = {viewport: Viewport | null; scroll: {left: number; top: number}; bounds: Bounds | null};
const nominal = RENDER_CONTEXT_OPTIONS.viewport;

function capturePage(layout: (viewport: Viewport | null, read: number) => Bounds | null,
    initialViewport: Viewport | null = {...nominal}, fontsReady: Promise<void> = Promise.resolve()) {
    const state = {viewport: initialViewport, scroll: {left: 31, top: 540}};
    const events: string[] = [];
    const measurements: Observation[] = [];
    const captures: Observation[] = [];
    const observe = (bounds: Bounds | null): Observation => ({
        viewport: state.viewport && {...state.viewport}, scroll: {...state.scroll}, bounds
    });
    const scrollTo = vi.fn((options: ScrollToOptions) => {
        events.push('scroll');
        state.scroll = {left: options.left ?? 0, top: options.top ?? 0};
    });
    vi.stubGlobal('window', {scrollTo});
    let signalFontWait!: () => void;
    const fontWaitStarted = new Promise<void>(resolve => { signalFontWait = resolve; });
    vi.stubGlobal('document', {fonts: {
        get ready() {
            events.push('fonts-requested');
            signalFontWait();
            return fontsReady.then(() => { events.push('fonts-ready'); });
        }
    }});
    const view = {
        boundingBox: vi.fn(async () => {
            events.push('measure');
            const bounds = layout(state.viewport, measurements.length);
            measurements.push(observe(bounds));
            return bounds;
        }),
        screenshot: vi.fn(async (_options: {path: string; omitBackground?: boolean}) => {
            events.push('screenshot');
            captures.push(observe(measurements.at(-1)?.bounds ?? null));
            return Buffer.alloc(0);
        })
    };
    const methods = {
        viewportSize: vi.fn(() => state.viewport),
        setViewportSize: vi.fn(async (viewport: Viewport) => {
            events.push('resize');
            state.viewport = {...viewport};
        }),
        evaluate: vi.fn(async (effect: () => void | Promise<void>) => effect()),
        waitForFunction: vi.fn(async (condition: () => Promise<boolean>) => condition()),
        locator: vi.fn((selector: string) => {
            if (selector !== '#view') throw new Error(`Unexpected capture selector: ${selector}`);
            return view;
        })
    };
    // The double models only the Page/Locator operations used by element capture.
    return {page: methods as unknown as Page, methods, view, state, events, measurements, captures, scrollTo, fontWaitStarted};
}

afterEach(() => vi.unstubAllGlobals());

describe('captureViewScreenshot', () => {
    it('captures a short card at the nominal viewport after resetting scroll', async () => {
        const card = {x: 0, y: 0, width: 800, height: 600};
        const capture = capturePage(() => card);

        await captureViewScreenshot(capture.page, 'short.png');

        expect(capture.methods.setViewportSize).not.toHaveBeenCalled();
        expect(capture.measurements[0]).toEqual({viewport: nominal, scroll: {left: 0, top: 0}, bounds: card});
        expect(capture.scrollTo).toHaveBeenCalledWith({left: 0, top: 0, behavior: 'instant'});
        expect(capture.events).toEqual(['scroll', 'measure', 'fonts-requested', 'fonts-ready', 'measure', 'screenshot']);
        expect(capture.view.screenshot).toHaveBeenCalledWith({path: 'short.png', omitBackground: true});
    });

    it('waits for fonts initiated by layout and fits the final card rather than its fallback-font size', async () => {
        let releaseFonts!: () => void;
        const fontsReady = new Promise<void>(resolve => { releaseFonts = resolve; });
        let cardHeight = 860;
        const capture = capturePage(() => ({x: 0, y: 0, width: 800, height: cardHeight}), {...nominal}, fontsReady);
        const operation = captureViewScreenshot(capture.page, 'loaded-fonts.png');

        const firstPhase = await Promise.race([
            capture.fontWaitStarted.then(() => 'waiting-for-fonts'),
            operation.then(() => 'captured')
        ]);
        expect(firstPhase).toBe('waiting-for-fonts');
        expect(capture.measurements.map(observation => observation.bounds?.height)).toEqual([860]);
        expect(capture.methods.setViewportSize).not.toHaveBeenCalled();
        expect(capture.view.screenshot).not.toHaveBeenCalled();

        cardHeight = 884;
        releaseFonts();
        await operation;

        expect(capture.measurements.map(observation => observation.bounds?.height)).toEqual([860, 884, 884]);
        expect(capture.captures[0]?.viewport).toEqual({width: 1280, height: 948});
        expect(capture.captures[0]?.bounds?.height).toBe(884);
        expect(capture.events.indexOf('measure')).toBeLessThan(capture.events.indexOf('fonts-requested'));
        expect(capture.events.indexOf('fonts-ready')).toBeLessThan(capture.events.indexOf('resize'));
        expect(capture.events.lastIndexOf('measure')).toBeLessThan(capture.events.indexOf('screenshot'));
    });

    it.each([null, {width: 900, height: 720}, {width: 1280, height: 2200}])(
        'restores the nominal viewport before measuring when the prior viewport is %j', async previous => {
            const capture = capturePage(() => ({x: 0, y: 0, width: 780, height: 500}), previous);

            await captureViewScreenshot(capture.page, 'reset.png');

            expect(capture.measurements[0]?.viewport).toEqual(nominal);
            expect(capture.measurements[0]?.scroll).toEqual({left: 0, top: 0});
            expect(capture.events.indexOf('resize')).toBeLessThan(capture.events.indexOf('measure'));
            expect(capture.captures[0]?.viewport).toEqual(nominal);
        }
    );

    it.each([
        {name: 'tall', bounds: {x: 0, y: 0, width: 800, height: 1800}},
        {name: 'fractional', bounds: {x: 12.5, y: 8.25, width: 800.25, height: 711.875}},
        {name: 'offset', bounds: {x: 40, y: 260, width: 900, height: 700}}
    ])('fits a $name card completely without changing viewport width', async ({bounds}) => {
        const capture = capturePage(() => bounds);

        await captureViewScreenshot(capture.page, 'fitted.png');

        const fitted = capture.captures[0]!;
        expect(fitted.viewport?.width).toBe(1280);
        expect(Number.isInteger(fitted.viewport?.height)).toBe(true);
        expect(fitted.viewport!.height).toBeGreaterThanOrEqual(Math.ceil(bounds.y + bounds.height));
        expect(fitted.scroll).toEqual({left: 0, top: 0});
        expect(fitted.bounds).toEqual(bounds);
        expect(capture.measurements[0]?.viewport).toEqual(nominal);
        expect(capture.measurements.at(-1)?.viewport).toEqual(fitted.viewport);
        expect(capture.events.lastIndexOf('resize')).toBeLessThan(capture.events.lastIndexOf('measure'));
        expect(capture.events.lastIndexOf('scroll')).toBeLessThan(capture.events.lastIndexOf('measure'));
        expect(capture.events.at(-1)).toBe('screenshot');
    });

    it('does not carry a tall viewport or scroll position into the next short sample', async () => {
        let card = {x: 0, y: 0, width: 800, height: 1600};
        const capture = capturePage(() => card);
        await captureViewScreenshot(capture.page, 'first-tall.png');
        expect(capture.captures[0]!.viewport!.height).toBeGreaterThanOrEqual(1600);
        card = {x: 0, y: 0, width: 800, height: 430};
        capture.state.scroll = {left: 18, top: 730};

        await captureViewScreenshot(capture.page, 'next-short.png');

        expect(capture.captures[1]).toEqual({viewport: nominal, scroll: {left: 0, top: 0}, bounds: card});
        expect(capture.measurements.at(-1)?.viewport).toEqual(nominal);
        expect(capture.view.screenshot.mock.calls.map(([options]) => options.path)).toEqual(['first-tall.png', 'next-short.png']);
    });

    it('rejects a missing layout box without writing an image', async () => {
        const capture = capturePage(() => null);

        await expect(captureViewScreenshot(capture.page, 'missing.png')).rejects.toThrow(/no layout box/);

        expect(capture.view.screenshot).not.toHaveBeenCalled();
    });

    it('rejects a card that disappears while fitting its viewport', async () => {
        const capture = capturePage((_viewport, read) => read < 2 ? {x: 0, y: 0, width: 800, height: 1000} : null);

        await expect(captureViewScreenshot(capture.page, 'disappeared.png')).rejects.toThrow(/disappeared after resizing/);

        expect(capture.methods.setViewportSize).toHaveBeenCalled();
        expect(capture.view.screenshot).not.toHaveBeenCalled();
    });

    it('rejects a card that disappears during font loading before resizing or screenshotting', async () => {
        const capture = capturePage((_viewport, read) => read === 0 ? {x: 0, y: 0, width: 800, height: 1000} : null);

        await expect(captureViewScreenshot(capture.page, 'font-disappearance.png')).rejects.toThrow(/disappeared while loading fonts/);

        expect(capture.events).toEqual(['scroll', 'measure', 'fonts-requested', 'fonts-ready', 'measure']);
        expect(capture.methods.setViewportSize).not.toHaveBeenCalled();
        expect(capture.view.screenshot).not.toHaveBeenCalled();
    });

    it('propagates a bounded font-readiness failure without screenshotting', async () => {
        const capture = capturePage(() => ({x: 0, y: 0, width: 800, height: 860}));
        const failure = new Error('page.waitForFunction: font readiness timed out');
        capture.methods.waitForFunction.mockRejectedValueOnce(failure);

        await expect(captureViewScreenshot(capture.page, 'fonts-timeout.png')).rejects.toBe(failure);

        expect(capture.measurements).toHaveLength(1);
        expect(capture.methods.setViewportSize).not.toHaveBeenCalled();
        expect(capture.view.screenshot).not.toHaveBeenCalled();
    });

    it.each([
        {name: 'negative horizontal offset', before: {x: -0.25, y: 0, width: 800, height: 500}},
        {name: 'negative vertical offset', before: {x: 0, y: -0.25, width: 800, height: 500}},
        {name: 'horizontal overflow', before: {x: 100, y: 0, width: 1200, height: 500}},
        {name: 'continued vertical growth', before: {x: 0, y: 0, width: 800, height: 1000},
            after: {x: 0, y: 0, width: 800, height: 2200}}
    ])('rejects $name instead of capturing incomplete content', async ({before, ...rest}) => {
        const after = 'after' in rest ? rest.after : undefined;
        const capture = capturePage((_viewport, read) => read < 2 ? before : after ?? before);

        await expect(captureViewScreenshot(capture.page, 'overflow.png')).rejects.toThrow(/complete bounds must fit/);

        expect(capture.view.screenshot).not.toHaveBeenCalled();
    });

    it('propagates the original screenshot failure', async () => {
        const capture = capturePage(() => ({x: 0, y: 0, width: 800, height: 500}));
        const failure = new Error('Screenshot output could not be written');
        capture.view.screenshot.mockRejectedValueOnce(failure);

        await expect(captureViewScreenshot(capture.page, 'failed.png')).rejects.toBe(failure);
    });
});
