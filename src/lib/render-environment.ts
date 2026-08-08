export const PLAYWRIGHT_VERSION = '1.60.0';
export const CANONICAL_RENDERER_PLATFORM = 'linux/amd64';
export const CANONICAL_RENDERER_IMAGE =
    'mcr.microsoft.com/playwright:v1.60.0-noble@sha256:9bd26ad900bb5e0f4dee75839e957a89ae89c2b7ab1e76050e559790e946b948';
export const CANONICAL_RENDERER_ID =
    'playwright-1.60.0-noble-linux-amd64@sha256:9bd26ad900bb5e0f4dee75839e957a89ae89c2b7ab1e76050e559790e946b948';
export const RENDERER_ENVIRONMENT_VARIABLE = 'EDUGRAPH_RENDERER_ENVIRONMENT';

/**
 * Browser-context defaults are explicit so a Playwright upgrade cannot silently
 * change pixels through a new locale, viewport, scale, or media preference.
 */
export const RENDER_CONTEXT_OPTIONS = {
    viewport: { width: 1280, height: 720 },
    deviceScaleFactor: 1,
    locale: 'en-US',
    timezoneId: 'UTC',
    colorScheme: 'light' as const,
    reducedMotion: 'reduce' as const,
    serviceWorkers: 'block' as const
};

export function currentRendererEnvironment(): string {
    const configured = process.env[RENDERER_ENVIRONMENT_VARIABLE]?.trim();
    return configured || `native:${process.platform}-${process.arch}:playwright-${PLAYWRIGHT_VERSION}`;
}

