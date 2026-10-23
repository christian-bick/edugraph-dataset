import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
    CANONICAL_RENDERER_ID,
    CANONICAL_RENDERER_IMAGE,
    CANONICAL_RENDERER_PLATFORM,
    PLAYWRIGHT_VERSION,
    RENDER_CONTEXT_OPTIONS,
    RENDERER_ENVIRONMENT_VARIABLE,
    currentRendererEnvironment
} from './render-environment.ts';

describe('render environment', () => {
    it('keeps the canonical image aligned with the Playwright dependency', () => {
        const packageJson = JSON.parse(readFileSync(resolve(process.cwd(), 'package.json'), 'utf-8'));
        expect(packageJson.devDependencies.playwright).toBe(PLAYWRIGHT_VERSION);
        expect(CANONICAL_RENDERER_IMAGE).toContain(`playwright:v${PLAYWRIGHT_VERSION}-noble@sha256:`);
        expect(CANONICAL_RENDERER_PLATFORM).toBe('linux/amd64');
    });

    it('starts captures at 1280x720 while retaining the fixed width ceiling', () => {
        expect(RENDER_CONTEXT_OPTIONS.viewport).toEqual({width: 1280, height: 720});
    });

    it('versions the fitted capture policy separately from the canonical browser image', () => {
        expect(CANONICAL_RENDERER_ID).toMatch(/:capture-fit-view-v1$/);
        expect(CANONICAL_RENDERER_ID.split('@sha256:')[1]?.split(':')[0])
            .toBe(CANONICAL_RENDERER_IMAGE.split('@sha256:')[1]);
    });

    it('uses the explicit environment identity when generation is containerized', () => {
        const previous = process.env[RENDERER_ENVIRONMENT_VARIABLE];
        process.env[RENDERER_ENVIRONMENT_VARIABLE] = CANONICAL_RENDERER_ID;
        try {
            expect(currentRendererEnvironment()).toBe(CANONICAL_RENDERER_ID);
        } finally {
            if (previous === undefined) delete process.env[RENDERER_ENVIRONMENT_VARIABLE];
            else process.env[RENDERER_ENVIRONMENT_VARIABLE] = previous;
        }
    });
});
