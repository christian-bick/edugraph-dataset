import {execFileSync, spawnSync} from 'node:child_process';
import {existsSync} from 'node:fs';
import {dirname, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {getCliOption} from '../lib/cli.ts';
import {planDevelopmentValidation, type DevelopmentCheck} from '../lib/development-plan.ts';
import {listSpecModules, listUnionSpecs} from '../lib/spec-catalog.ts';

const PROJECT_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const args = process.argv.slice(2);

function gitLines(gitArgs: string[]): string[] {
    try {
        return execFileSync('git', gitArgs, {cwd: PROJECT_ROOT, encoding: 'utf-8'})
            .split(/\r?\n/)
            .filter(Boolean);
    } catch (error) {
        throw new Error(`Cannot resolve changed files with git ${gitArgs.join(' ')}: ${String(error)}`);
    }
}

function changedFiles(): string[] {
    const explicit = getCliOption(args, 'files');
    if (explicit) return explicit.split(',').map(file => file.trim()).filter(Boolean);
    const base = getCliOption(args, 'base');
    const committed = base
        ? gitLines(['diff', '--name-only', '--diff-filter=ACMRD', `${base}...HEAD`])
        : [];
    const working = gitLines(['diff', '--name-only', '--diff-filter=ACMRD', 'HEAD']);
    const untracked = gitLines(['ls-files', '--others', '--exclude-standard']);
    return [...committed, ...working, ...untracked];
}

function run(command: string, commandArgs: string[]): boolean {
    const result = spawnSync(command, commandArgs, {
        cwd: PROJECT_ROOT,
        stdio: 'inherit',
        shell: false
    });
    if (result.error) {
        console.error(result.error);
        return false;
    }
    return result.status === 0;
}

const runNode = (modulePath: string, moduleArgs: string[] = []): boolean =>
    run(process.execPath, [resolve(PROJECT_ROOT, modulePath), ...moduleArgs]);

function runCheck(check: DevelopmentCheck, sourceFiles: string[], generatorCoverageFiles: string[]): boolean {
    switch (check) {
        case 'types':
            return runNode('node_modules/typescript/bin/tsc', ['--noEmit']);
        case 'related-tests': {
            const existingSources = sourceFiles.filter(file => file.startsWith('src/') && existsSync(resolve(PROJECT_ROOT, file)));
            return existingSources.length === 0 || runNode('node_modules/vitest/vitest.mjs', [
                'related', '--run', '--pool=threads',
                '--exclude', '**/*.it.test.ts',
                ...(generatorCoverageFiles.length > 0
                    ? ['--coverage', '--coverage.reporter=json-summary']
                    : []),
                ...existingSources.map(file => resolve(PROJECT_ROOT, file))
            ]);
        }
        case 'generator-view-specs':
            return runNode('node_modules/vite-node/dist/cli.mjs', ['src/scripts/validate-generator-view-specs.ts']);
        case 'labels':
            return runNode('node_modules/vite-node/dist/cli.mjs', ['src/scripts/check-labels.ts']);
        case 'docs':
            return runNode('node_modules/vite-node/dist/cli.mjs', ['src/scripts/validate-docs.ts']);
        case 'generator-coverage':
            return runNode('node_modules/vite-node/dist/cli.mjs', [
                'src/scripts/check-generator-coverage.ts',
                `--files=${generatorCoverageFiles.join(',')}`
            ]);
    }
}

async function main(): Promise<void> {
    if (args.includes('--full')) {
        process.exitCode = runNode('node_modules/vite-node/dist/cli.mjs', ['src/scripts/check-all.ts']) ? 0 : 1;
        return;
    }

    const files = changedFiles();
    const plan = planDevelopmentValidation(
        files,
        listSpecModules(resolve(PROJECT_ROOT, 'src', 'spec')),
        await listUnionSpecs(),
        files.filter(file => !existsSync(resolve(PROJECT_ROOT, file)))
    );
    console.log(JSON.stringify(plan, null, 2));
    if (args.includes('--plan-only') || plan.changed_files.length === 0) return;

    let passed = true;
    const generatorCoverageFiles = plan.changed_files.filter(file =>
        /^src\/generators\/(?:[^/]+\/)?[^/]+\/generator\.ts$/.test(file)
        && existsSync(resolve(PROJECT_ROOT, file)));
    for (const check of plan.checks) {
        console.log(`\n--- Affected check: ${check} ---`);
        if (!runCheck(check, plan.changed_files, generatorCoverageFiles)) passed = false;
    }
    if (plan.specs.length > 0) {
        console.log(`\n--- Affected standard specs: ${plan.specs.join(', ')} ---`);
        if (!runNode('node_modules/vite-node/dist/cli.mjs', [
            'src/scripts/validate-standards-spec.ts', `--spec=${plan.specs.join(',')}`
        ])) passed = false;
    }
    if (!passed) process.exitCode = 1;
}

main().catch(error => {
    console.error(error);
    process.exitCode = 1;
});
