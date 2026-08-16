import { describe, expect, it } from 'vitest';
import {
    containerDependencyVolume,
    containerGenerationDockerArgs,
    normalizedGenerationArgs
} from './container-generation.ts';
import {
    CANONICAL_RENDERER_ID,
    CANONICAL_RENDERER_IMAGE,
    CANONICAL_RENDERER_PLATFORM,
    CANONICAL_RENDERER_PORT,
    RENDERER_ENVIRONMENT_VARIABLE,
    RENDERER_PORT_VARIABLE
} from './render-environment.ts';

describe('container generation command', () => {
    it('normalizes npm-config options without overriding explicit CLI arguments', () => {
        expect(normalizedGenerationArgs(['--spec=explicit'], {
            npm_config_spec: 'environment',
            npm_config_generator: 'writing',
            npm_config_training_only: 'true'
        })).toEqual(['--spec=explicit', '--generator=writing', '--training-only']);
    });

    it('keys the reusable dependency volume by lockfile and renderer', () => {
        expect(containerDependencyVolume('lock-a')).toBe(containerDependencyVolume('lock-a'));
        expect(containerDependencyVolume('lock-a')).not.toBe(containerDependencyVolume('lock-b'));
    });

    it('mounts source, isolated dependencies, npm cache, and forwards scope arguments', () => {
        const args = containerGenerationDockerArgs({
            containerName: 'edugraph-test',
            projectRoot: '/repo',
            npmCacheDir: '/cache/npm',
            packageLock: 'lock',
            generationArgs: ['--spec=test', '--generator=writing'],
            hostUid: 1001,
            hostGid: 1002
        });
        expect(args).toContain(CANONICAL_RENDERER_IMAGE);
        expect(args).toContain(CANONICAL_RENDERER_PLATFORM);
        expect(args).toContain(`type=bind,source=/repo,target=/host-workspace`);
        expect(args).toContain('edugraph-test');
        expect(args).toContain(`type=bind,source=/cache/npm,target=/root/.npm`);
        expect(args).toContain(`${RENDERER_ENVIRONMENT_VARIABLE}=${CANONICAL_RENDERER_ID}`);
        expect(args).toContain(`${RENDERER_PORT_VARIABLE}=${CANONICAL_RENDERER_PORT}`);
        expect(args).toContain('EDUGRAPH_HOST_UID=1001');
        expect(args.slice(-2)).toEqual(['--spec=test', '--generator=writing']);
    });

    it('rejects ambiguous Docker mount sources', () => {
        expect(() => containerGenerationDockerArgs({
            containerName: 'edugraph-test',
            projectRoot: '/repo,other',
            npmCacheDir: '/cache/npm',
            packageLock: 'lock',
            generationArgs: []
        })).toThrow('cannot contain a comma');
    });
});
