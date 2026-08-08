import { existsSync, mkdirSync, readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, resolve } from 'node:path';
import { spawn, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { containerGenerationDockerArgs, normalizedGenerationArgs } from '../lib/container-generation.ts';

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

    const args = containerGenerationDockerArgs({
        containerName,
        projectRoot,
        npmCacheDir: cacheDir,
        packageLock: readFileSync(packageLockPath, 'utf-8'),
        generationArgs: normalizedGenerationArgs(process.argv.slice(2), process.env),
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
