import { createHash } from 'node:crypto';
import {
    CANONICAL_RENDERER_ID,
    CANONICAL_RENDERER_IMAGE,
    CANONICAL_RENDERER_PLATFORM,
    RENDERER_ENVIRONMENT_VARIABLE
} from './render-environment.ts';

export interface ContainerGenerationOptions {
    containerName: string;
    projectRoot: string;
    npmCacheDir: string;
    packageLock: string;
    generationArgs: string[];
    hostUid?: number;
    hostGid?: number;
}

const GENERATION_OPTIONS = ['spec', 'generator', 'view', 'concurrency'] as const;

export function normalizedGenerationArgs(
    cliArgs: readonly string[],
    env: NodeJS.ProcessEnv
): string[] {
    const normalized = [...cliArgs];
    for (const name of GENERATION_OPTIONS) {
        if (normalized.some(arg => arg === `--${name}` || arg.startsWith(`--${name}=`))) continue;
        const value = env[`npm_config_${name}`]?.trim();
        if (value) normalized.push(`--${name}=${value}`);
    }
    if (!normalized.includes('--training-only')) {
        const trainingOnly = env.npm_config_training_only;
        if (trainingOnly === '' || trainingOnly === 'true') normalized.push('--training-only');
    }
    return normalized;
}

export function containerDependencyVolume(packageLock: string): string {
    const key = createHash('sha256')
        .update(CANONICAL_RENDERER_ID)
        .update('\0')
        .update(packageLock)
        .digest('hex')
        .slice(0, 16);
    return `edugraph-content-node-modules-${key}`;
}

function mount(type: 'bind' | 'volume', source: string, target: string): string {
    if (source.includes(',')) throw new Error(`Docker mount source cannot contain a comma: ${source}`);
    return `type=${type},source=${source},target=${target}`;
}

export function containerGenerationDockerArgs(options: ContainerGenerationOptions): string[] {
    const args = [
        'run',
        '--rm',
        '--init',
        '--ipc=host',
        '--name', options.containerName,
        '--platform', CANONICAL_RENDERER_PLATFORM,
        '--mount', mount('bind', options.projectRoot, '/host-workspace'),
        '--mount', mount('volume', containerDependencyVolume(options.packageLock), '/workspace/node_modules'),
        '--mount', mount('bind', options.npmCacheDir, '/root/.npm'),
        '--workdir', '/workspace',
        '--env', `${RENDERER_ENVIRONMENT_VARIABLE}=${CANONICAL_RENDERER_ID}`,
        '--env', 'CI=true',
        '--env', 'TZ=UTC',
        '--env', 'LANG=C.UTF-8'
    ];
    if (options.hostUid !== undefined && options.hostGid !== undefined) {
        args.push('--env', `EDUGRAPH_HOST_UID=${options.hostUid}`);
        args.push('--env', `EDUGRAPH_HOST_GID=${options.hostGid}`);
    }
    args.push(
        CANONICAL_RENDERER_IMAGE,
        '/bin/bash',
        '/host-workspace/scripts/run-containerized-generation.sh',
        ...options.generationArgs
    );
    return args;
}
