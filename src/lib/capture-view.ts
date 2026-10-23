import type {Page} from 'playwright';
import {RENDER_CONTEXT_OPTIONS} from './render-environment.ts';

const VIEWPORT_BOTTOM_PADDING = 64;

/**
 * Keep the complete card inside the viewport during element capture. Chromium's
 * beyond-viewport capture path can rasterize transparent rounded edges differently.
 * Resetting first makes the capture independent of the previous sample's size.
 */
export async function captureViewScreenshot(page: Page, path: string): Promise<void> {
    const nominalViewport = {...RENDER_CONTEXT_OPTIONS.viewport};
    const previousViewport = page.viewportSize();
    if (!previousViewport
        || previousViewport.width !== nominalViewport.width
        || previousViewport.height !== nominalViewport.height) {
        await page.setViewportSize(nominalViewport);
    }
    await page.evaluate(() => window.scrollTo({left: 0, top: 0, behavior: 'instant'}));

    const view = page.locator('#view');
    let bounds = await view.boundingBox();
    if (!bounds) throw new Error('Cannot capture #view: the element has no layout box.');
    // Reading layout initiates fonts needed by this card. Waiting before that
    // read can observe the previous card's already-resolved font readiness.
    await page.waitForFunction(async () => { await document.fonts.ready; return true; });
    bounds = await view.boundingBox();
    if (!bounds) throw new Error('Cannot capture #view: its layout box disappeared while loading fonts.');

    let viewport = nominalViewport;
    if (bounds.y + bounds.height > nominalViewport.height) {
        viewport = {
            width: nominalViewport.width,
            height: Math.ceil(bounds.y + bounds.height) + VIEWPORT_BOTTOM_PADDING
        };
        await page.setViewportSize(viewport);
        await page.evaluate(() => window.scrollTo({left: 0, top: 0, behavior: 'instant'}));
        bounds = await view.boundingBox();
    }
    if (!bounds) throw new Error('Cannot capture #view: its layout box disappeared after resizing.');
    if (bounds.x < 0 || bounds.y < 0
        || bounds.x + bounds.width > viewport.width
        || bounds.y + bounds.height > viewport.height) {
        throw new Error('Cannot capture #view: its complete bounds must fit inside the fixed-width viewport.');
    }

    await view.screenshot({path, omitBackground: true});
}
