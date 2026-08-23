import {execFileSync} from 'node:child_process';
import {existsSync, readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {
    SourceContentIndex,
    digestFile,
    radixSortUtf8
} from './content-identity.ts';
import type {DependencyGraphSnapshot} from './dependency-planner.ts';

export const DEVELOPMENT_OBSERVATION_SCHEMA_VERSION = 3;

export interface DevelopmentInputObservation {
    schema_version: number;
    git_head: string;
    dirty_files: string[];
    input_files: Record<string, string>;
    node_ids_by_file: Record<string, string[]>;
    /** Direct module entry files, used to load selected modules without rediscovery. */
    entry_files_by_node: Record<string, string>;
    renderer_environment: string;
    ontology_semantic_sha256: string | null;
}

export interface DevelopmentObservationResult {
    clean: boolean;
    reason: string;
    candidate_files: number;
    relevant_files_checked: number;
    changed_files: string[];
    candidate_nodes: string[];
    manual_rebuild_files: string[];
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

function ignoredPotentialInputs(projectRoot: string, specName: string): string[] {
    const roots = [
        `src/spec/${specName}`,
        `src/spec/${specName}.ts`,
        'src/generators',
        'src/visuals/views',
        'public/icons'
    ];
    return gitLines(projectRoot, [
        'ls-files', '--others', '--ignored', '--exclude-standard', '--', ...roots
    ]).filter(path => isPotentialNewInput(path, specName));
}

function isPotentialNewInput(path: string, specName: string): boolean {
    if (path.endsWith('.test.ts') || path.endsWith('.test.tsx')) return false;
    if (path === `src/spec/${specName}.ts` || path.startsWith(`src/spec/${specName}/`)) {
        return path.endsWith('.ts');
    }
    if (path.startsWith('src/generators/')) {
        return /\.(?:cjs|js|json|mjs|ts|tsx)$/.test(path);
    }
    if (path.startsWith('src/visuals/views/')) {
        return /\.(?:cjs|css|js|json|md|mjs|ts|tsx)$/.test(path);
    }
    return path.startsWith('public/icons/')
        && /\.(?:jpeg|jpg|png|svg|webp)$/.test(path);
}

function graphSourceInputs(graph: DependencyGraphSnapshot): {
    hashes: Record<string, string>;
    nodeIdsByFile: Record<string, string[]>;
} {
    const files = new Map<string, string>();
    const nodesBySource = new Map<string, string[]>();
    for (const node of Object.values(graph.nodes)) {
        for (const dependency of node.dependencies) {
            if (!dependency.startsWith('source:')) continue;
            const nodes = nodesBySource.get(dependency);
            if (nodes) nodes.push(node.id);
            else nodesBySource.set(dependency, [node.id]);
        }
    }
    for (const node of Object.values(graph.nodes)) {
        if (node.kind !== 'source-file' || node.output?.bytes === undefined) continue;
        const path = node.id.slice('source:'.length);
        files.set(normalizePath(path), node.input_hash);
    }
    const paths = radixSortUtf8([...files.keys()]);
    return {
        hashes: Object.fromEntries(paths.map(path => [path, files.get(path)!])),
        nodeIdsByFile: Object.fromEntries(paths.map(path => [
            path,
            radixSortUtf8([...(nodesBySource.get(`source:${path}`) ?? [])])
        ]))
    };
}

function isPotentialMachinerySource(path: string): boolean {
    if (path.endsWith('.test.ts') || path.endsWith('.test.tsx') || path.endsWith('.md')) {
        return false;
    }
    if (path.startsWith('docs/')
        || path.startsWith('.agents/')
        || path.startsWith('cache/')
        || path.startsWith('out/')
        || path.startsWith('temp/')
        || path.startsWith('public/coverage/')) {
        return false;
    }
    return /(?:^|\/)(?:[^/]+\.)?(?:cjs|js|json|jsx|lock|mjs|toml|ts|tsx|yaml|yml)$/.test(path);
}

function semanticSnapshotHash(projectRoot: string): string | null {
    const path = resolve(projectRoot, 'config', 'external-semantics', 'ontology.json');
    if (!existsSync(path)) return null;
    try {
        const snapshot = JSON.parse(readFileSync(path, 'utf-8')) as {semantic_sha256?: unknown};
        return typeof snapshot.semantic_sha256 === 'string' ? snapshot.semantic_sha256 : null;
    } catch {
        return null;
    }
}

function specSourcePath(projectRoot: string, specName: string): string {
    const directory = resolve(projectRoot, 'src', 'spec', specName);
    return existsSync(directory) ? directory : `${directory}.ts`;
}

export function summarizeManualRebuildFiles(paths: readonly string[], limit = 5): string {
    const shown = paths.slice(0, limit).join(', ');
    const remaining = paths.length - Math.min(paths.length, limit);
    return remaining > 0 ? `${shown} (+${remaining} more)` : shown;
}

/**
 * Captures a conservative acceleration index for development. The dependency
 * graph remains authoritative; Git is used only to discover which recorded
 * input bytes may need to be compared on the next affected run.
 */
export function captureDevelopmentInputObservation(options: {
    projectRoot: string;
    specName: string;
    graph: DependencyGraphSnapshot;
    sourceIndex: SourceContentIndex;
    rendererEnvironment: string;
    entryFilesByNode?: Readonly<Record<string, string>>;
}): DevelopmentInputObservation | null {
    try {
        const extraInputs = options.sourceIndex.identities([
            specSourcePath(options.projectRoot, options.specName),
            resolve(options.projectRoot, 'config', 'external-semantics', 'ontology.json')
        ], {
            include: path => !path.endsWith('.test.ts') && !path.endsWith('.test.tsx')
        });
        const graphInputs = graphSourceInputs(options.graph);
        const files = new Map(Object.entries(graphInputs.hashes));
        for (const identity of extraInputs) files.set(normalizePath(identity.path), identity.sha256);
        return {
            schema_version: DEVELOPMENT_OBSERVATION_SCHEMA_VERSION,
            git_head: gitHead(options.projectRoot),
            dirty_files: dirtyFiles(options.projectRoot),
            input_files: Object.fromEntries(radixSortUtf8([...files.keys()])
                .map(path => [path, files.get(path)!])),
            node_ids_by_file: graphInputs.nodeIdsByFile,
            entry_files_by_node: Object.fromEntries(radixSortUtf8(Object.keys(
                options.entryFilesByNode ?? {}
            )).map(nodeId => [
                nodeId,
                normalizePath(options.entryFilesByNode![nodeId])
            ])),
            renderer_environment: options.rendererEnvironment,
            ontology_semantic_sha256: semanticSnapshotHash(options.projectRoot)
        };
    } catch {
        return null;
    }
}

/**
 * Proves an exact development no-op from a prior observation. Any unsupported,
 * ambiguous, or ignored graph input returns a conservative miss.
 */
export function inspectDevelopmentInputObservation(options: {
    projectRoot: string;
    specName: string;
    previous: DevelopmentInputObservation | null | undefined;
    rendererEnvironment: string;
}): DevelopmentObservationResult {
    const previous = options.previous;
    const miss = (
        reason: string,
        candidateFiles = 0,
        checked = 0,
        changedFiles: string[] = [],
        candidateNodes: string[] = [],
        manualRebuildFiles: string[] = []
    ): DevelopmentObservationResult => ({
        clean: false,
        reason,
        candidate_files: candidateFiles,
        relevant_files_checked: checked,
        changed_files: changedFiles,
        candidate_nodes: candidateNodes,
        manual_rebuild_files: manualRebuildFiles
    });
    if (!previous || previous.schema_version !== DEVELOPMENT_OBSERVATION_SCHEMA_VERSION) {
        return miss('development observation is missing or unsupported');
    }
    if (previous.renderer_environment !== options.rendererEnvironment) {
        return miss('renderer environment changed');
    }
    if (previous.ontology_semantic_sha256 !== semanticSnapshotHash(options.projectRoot)) {
        return miss('accepted ontology semantics changed');
    }

    try {
        const currentHead = gitHead(options.projectRoot);
        const currentDirty = dirtyFiles(options.projectRoot);
        const committed = currentHead === previous.git_head
            ? []
            : gitLines(options.projectRoot, [
                'diff', '--name-only', '--no-renames', previous.git_head, currentHead
            ]);
        const candidates = radixSortUtf8([...new Set([
            ...previous.dirty_files,
            ...currentDirty,
            ...committed
        ])]);
        const ignored = ignoredPotentialInputs(options.projectRoot, options.specName);
        if (ignored.length > 0) {
            return miss(`ignored graph input cannot be observed: ${ignored[0]}`, candidates.length);
        }

        let checked = 0;
        const changedFiles: string[] = [];
        const candidateNodes = new Set<string>();
        const manualRebuildFiles: string[] = [];
        for (const path of candidates) {
            if (!(path in previous.input_files) && !isPotentialNewInput(path, options.specName)) {
                if (isPotentialMachinerySource(path)) manualRebuildFiles.push(path);
                continue;
            }
            checked++;
            const absolutePath = resolve(options.projectRoot, path);
            const currentHash = existsSync(absolutePath) ? digestFile(absolutePath).sha256 : null;
            const previousHash = previous.input_files[path] ?? null;
            if (currentHash !== previousHash) {
                changedFiles.push(path);
                for (const nodeId of previous.node_ids_by_file[path] ?? []) candidateNodes.add(nodeId);
            }
        }
        if (changedFiles.length > 0) {
            return miss(
                `graph input changed: ${changedFiles[0]}`,
                candidates.length,
                checked,
                radixSortUtf8(changedFiles),
                radixSortUtf8([...candidateNodes]),
                radixSortUtf8(manualRebuildFiles)
            );
        }
        return {
            clean: true,
            reason: 'all candidate graph inputs are byte-identical',
            candidate_files: candidates.length,
            relevant_files_checked: checked,
            changed_files: [],
            candidate_nodes: [],
            manual_rebuild_files: radixSortUtf8(manualRebuildFiles)
        };
    } catch (error) {
        return miss(`Git delta observation unavailable: ${error instanceof Error ? error.message : String(error)}`);
    }
}
