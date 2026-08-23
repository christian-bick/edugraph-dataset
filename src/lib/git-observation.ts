import {execFileSync, spawnSync} from 'node:child_process';
import {existsSync} from 'node:fs';
import {resolve} from 'node:path';
import {digestFile, radixSortUtf8} from './content-identity.ts';

export interface GitInputObservation {
    git_head: string;
    dirty_files: string[];
    input_files: Record<string, string>;
}

export interface GitInputInspection {
    clean: boolean;
    reason: string;
    candidate_files: number;
    relevant_files_checked: number;
    changed_files: string[];
}

const normalizePath = (path: string): string => path.replaceAll('\\', '/');

function gitLines(projectRoot: string, args: string[]): string[] {
    return execFileSync('git', args, {
        cwd: projectRoot,
        encoding: 'utf-8',
        stdio: ['ignore', 'pipe', 'ignore']
    }).split(/\r?\n/).map(normalizePath).filter(Boolean);
}

function gitHead(projectRoot: string): string {
    return gitLines(projectRoot, ['rev-parse', 'HEAD'])[0] ?? '';
}

function dirtyFiles(projectRoot: string): string[] {
    return radixSortUtf8([...new Set([
        ...gitLines(projectRoot, ['diff', '--name-only', '--no-renames', 'HEAD']),
        ...gitLines(projectRoot, ['ls-files', '--others', '--exclude-standard'])
    ])]);
}

function ignoredInputs(projectRoot: string, paths: readonly string[]): string[] {
    if (paths.length === 0) return [];
    const result = spawnSync('git', ['check-ignore', '--stdin'], {
        cwd: projectRoot,
        encoding: 'utf-8',
        input: `${paths.join('\n')}\n`,
        stdio: ['pipe', 'pipe', 'ignore'],
        maxBuffer: 10 * 1024 * 1024
    });
    if (result.status !== 0 && result.status !== 1) {
        throw new Error(`git check-ignore failed with status ${result.status ?? 'unknown'}.`);
    }
    return result.stdout.split(/\r?\n/).map(normalizePath).filter(Boolean);
}

export function captureGitInputObservation(
    projectRoot: string,
    inputFiles: Readonly<Record<string, string>>
): GitInputObservation | null {
    try {
        const paths = radixSortUtf8(Object.keys(inputFiles));
        if (ignoredInputs(projectRoot, paths).length > 0) return null;
        return {
            git_head: gitHead(projectRoot),
            dirty_files: dirtyFiles(projectRoot),
            input_files: Object.fromEntries(paths
                .map(path => [normalizePath(path), inputFiles[path]]))
        };
    } catch {
        return null;
    }
}

/**
 * Uses Git only to find candidate paths since a prior successful observation,
 * then compares the caller-defined semantic identity of relevant files.
 */
export function inspectGitInputObservation(options: {
    projectRoot: string;
    previous: GitInputObservation;
    potentialRoots: readonly string[];
    isPotentialInput: (path: string) => boolean;
    isIgnoredInput?: (path: string) => boolean;
    currentIdentity?: (absolutePath: string, relativePath: string) => string | null;
    inputName?: string;
}): GitInputInspection {
    const inputName = options.inputName ?? 'input';
    const miss = (
        reason: string,
        candidateFiles = 0,
        checked = 0,
        changedFiles: string[] = []
    ): GitInputInspection => ({
        clean: false,
        reason,
        candidate_files: candidateFiles,
        relevant_files_checked: checked,
        changed_files: changedFiles
    });
    try {
        const currentHead = gitHead(options.projectRoot);
        const currentDirty = dirtyFiles(options.projectRoot);
        const committed = currentHead === options.previous.git_head
            ? []
            : gitLines(options.projectRoot, [
                'diff', '--name-only', '--no-renames', options.previous.git_head, currentHead
            ]);
        const candidates = radixSortUtf8([...new Set([
            ...options.previous.dirty_files,
            ...currentDirty,
            ...committed
        ])]);
        const ignored = gitLines(options.projectRoot, [
            'ls-files', '--others', '--ignored', '--exclude-standard', '--',
            ...options.potentialRoots
        ]).filter(options.isIgnoredInput ?? options.isPotentialInput);
        if (ignored.length > 0) {
            return miss(`ignored ${inputName} cannot be observed: ${ignored[0]}`, candidates.length);
        }

        let checked = 0;
        const changedFiles: string[] = [];
        const currentIdentity = options.currentIdentity
            ?? ((absolutePath: string): string | null =>
                existsSync(absolutePath) ? digestFile(absolutePath).sha256 : null);
        for (const path of candidates) {
            if (!(path in options.previous.input_files) && !options.isPotentialInput(path)) continue;
            checked++;
            const identity = currentIdentity(resolve(options.projectRoot, path), path);
            if (identity !== (options.previous.input_files[path] ?? null)) changedFiles.push(path);
        }
        if (changedFiles.length > 0) {
            const changed = radixSortUtf8(changedFiles);
            return miss(`${inputName} changed: ${changed[0]}`, candidates.length, checked, changed);
        }
        return {
            clean: true,
            reason: `all candidate ${inputName}s are identical`,
            candidate_files: candidates.length,
            relevant_files_checked: checked,
            changed_files: []
        };
    } catch (error) {
        return miss(`Git delta observation unavailable: ${error instanceof Error ? error.message : String(error)}`);
    }
}
