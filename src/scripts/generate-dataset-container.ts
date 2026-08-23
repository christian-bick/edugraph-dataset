import { existsSync, mkdirSync, readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, resolve } from 'node:path';
import { spawn, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { containerGenerationDockerArgs, normalizedGenerationArgs } from '../lib/container-generation.ts';
import {getCliOption} from '../lib/cli.ts';
import {datasetDirForSpec, datasetOutDir} from '../lib/dataset-paths.ts';
import {
    DATASET_MANIFEST_SCHEMA_VERSION,
    readDatasetManifest
} from '../lib/dataset-manifest.ts';
import {DEPENDENCY_PLANNER_EPOCH} from '../lib/dependency-planner.ts';
import {inspectDevelopmentInputObservation} from '../lib/development-observation.ts';
import {CANONICAL_RENDERER_ID} from '../lib/render-environment.ts';

const __filename = fileURLToPath(import.meta.url);
const projectRoot = resolve(dirname(__filename), '..', '..');

function npmCacheDir(): string {
    const configured = process.env.npm_config_cache?.trim();
    if (configured) return resolve(configured);
    const command = process.platform === 'win32' ? 'npm.cmd' : 'npm';
    const result = spawnSync(command, ['config', 'get', 'cache'], { encoding: 'utf-8' });
    const discovered = result.status === 0 ? result.stdout.trim() : '';
    return discovered && discovered !== 'undefined' ? resolve(discovered) : resolve(homedir(), '.npm');
}

async function main(): Promise<void> {
    const packageLockPath = resolve(projectRoot, 'package-lock.json');
    if (!existsSync(packageLockPath)) throw new Error(`Missing package lock: ${packageLockPath}`);
    const cacheDir = npmCacheDir();
    mkdirSync(cacheDir, { recursive: true });
    const containerName = `edugraph-generation-${process.pid}`;
    const generationArgs = normalizedGenerationArgs(process.argv.slice(2), process.env);
    const specName = getCliOption(generationArgs, 'spec');

    if (specName
        && generationArgs.includes('--affected')
        && !generationArgs.includes('--rebuild-graph')
        && !generationArgs.includes('--reset-graph')
        && !getCliOption(generationArgs, 'generator')
        && !getCliOption(generationArgs, 'view')
        && !generationArgs.includes('--training-only')) {
        const outDir = datasetOutDir(projectRoot, datasetDirForSpec(specName));
        const manifest = readDatasetManifest(outDir);
        if (manifest?.schema_version === DATASET_MANIFEST_SCHEMA_VERSION
            && manifest.planner_epoch === DEPENDENCY_PLANNER_EPOCH
            && manifest.complete === true
            && manifest.spec === specName) {
            const observation = inspectDevelopmentInputObservation({
                projectRoot,
                specName,
                previous: manifest.development_observation,
                rendererEnvironment: CANONICAL_RENDERER_ID
            });
            if (observation.clean) {
                console.log(
                    `Development delta: clean (${observation.reason}); canonical container startup skipped.`
                );
                console.log(`[Work counters] ${JSON.stringify({
                    'dataset.development_candidate_files': observation.candidate_files,
                    'dataset.development_relevant_files_checked': observation.relevant_files_checked
                })}`);
                return;
            }
            console.log(`Development delta requires canonical graph planning: ${observation.reason}.`);
        }
    }

    const args = containerGenerationDockerArgs({
        containerName,
        projectRoot,
        npmCacheDir: cacheDir,
        packageLock: readFileSync(packageLockPath, 'utf-8'),
        generationArgs,
        hostUid: process.platform === 'win32' ? undefined : process.getuid?.(),
        hostGid: process.platform === 'win32' ? undefined : process.getgid?.()
    });

    console.log('Starting canonical container generation...');
    const child = spawn('docker', args, { cwd: projectRoot, stdio: 'inherit' });
    const stopContainer = () => {
        spawnSync('docker', ['stop', '--time', '5', containerName], { cwd: projectRoot, stdio: 'ignore' });
    };
    process.once('SIGINT', stopContainer);
    process.once('SIGTERM', stopContainer);
    const exitCode = await new Promise<number>((resolveExit, reject) => {
        child.once('error', reject);
        child.once('exit', code => resolveExit(code ?? 1));
    });
    process.removeListener('SIGINT', stopContainer);
    process.removeListener('SIGTERM', stopContainer);
    if (exitCode !== 0) throw new Error(`Canonical generation container exited with code ${exitCode}.`);
}

main().catch(error => {
    console.error(error);
    process.exitCode = 1;
});
