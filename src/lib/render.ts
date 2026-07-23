import { chromium } from 'playwright';
import { resolve } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { RenderPayload } from '../types/ml-engine.ts';

const BASE_URL = 'http://localhost:5173';

export interface RenderTask {
    fileName: string;
    viewId: string;
    payload: RenderPayload;
}

/**
 * Minimal sequential renderer for debug scripts (retest:sample, test:target).
 * Requires the vite dev server (`npm run dev`) to be running. The main
 * pipeline in generate-dataset.ts keeps its own concurrent worker pool.
 */
export async function renderTasks(
    tasks: RenderTask[],
    outDir: string,
    viewPathMap: Record<string, string>,
    baseUrl: string = BASE_URL
): Promise<string[]> {
    if (tasks.length === 0) return [];
    if (!existsSync(outDir)) {
        mkdirSync(outDir, { recursive: true });
    }

    const browser = await chromium.launch({ headless: true });
    const written: string[] = [];
    try {
        const context = await browser.newContext();
        const page = await context.newPage();
        let currentViewUrl = '';

        const sorted = [...tasks].sort((a, b) =>
            a.viewId.localeCompare(b.viewId) || a.fileName.localeCompare(b.fileName)
        );

        for (const task of sorted) {
            const viewPath = viewPathMap[task.viewId] || task.viewId;
            const url = `${baseUrl}/visuals/views/${viewPath}/view.html`;

            if (currentViewUrl !== url) {
                try {
                    await page.goto(url, { waitUntil: 'networkidle', timeout: 15000 });
                } catch (e) {
                    throw new Error(
                        `Could not load ${url} — is the vite dev server running? (npm run dev)`
                    );
                }
                await page.waitForFunction(() => typeof (window as any).renderView === 'function');
                // Same determinism measures as the main pipeline: no
                // transitions/animations, and fully loaded fonts/images.
                await page.addStyleTag({ content: '*, *::before, *::after { transition: none !important; animation: none !important; }' });
                currentViewUrl = url;
            }

            await page.evaluate((p) => window.renderView!(p), task.payload);
            await page.waitForFunction(() =>
                document.fonts.status === 'loaded'
                && Array.from(document.images).every(img => img.complete && img.naturalWidth > 0)
            );
            await page.waitForTimeout(60);

            const outPath = resolve(outDir, task.fileName);
            await page.locator('#view').screenshot({ path: outPath, omitBackground: true });
            written.push(outPath);
        }
        await context.close();
    } finally {
        await browser.close();
    }
    return written;
}
