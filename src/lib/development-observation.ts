import {existsSync} from 'node:fs';
import {resolve} from 'node:path';
import {
    SourceContentIndex,
    digestIdentity,
    radixSortUtf8
} from './content-identity.ts';
import type {DependencyGraphSnapshot} from './dependency-planner.ts';
import {resolveOntologyProvenance} from './coverage-identity.ts';
import {isAssetLibraryPath} from './asset-library.ts';
import {
    captureGitInputObservation,
    inspectGitInputObservation
} from './git-observation.ts';

export const DEVELOPMENT_OBSERVATION_SCHEMA_VERSION = 4;

export interface DevelopmentInputObservation {
    schema_version: number;
    git_head: string;
    dirty_files: string[];
    input_files: Record<string, string>;
    node_ids_by_file: Record<string, string[]>;
    /** Direct module entry files, used to load selected modules without rediscovery. */
    entry_files_by_node: Record<string, string>;
    renderer_environment: string;
    ontology_provenance_sha256: string;
}

export interface DevelopmentObservationResult {
    clean: boolean;
    reason: string;
    candidate_files: number;
    relevant_files_checked: number;
    changed_files: string[];
    candidate_nodes: string[];
}

const normalizePath = (path: string): string => path.replaceAll('\\', '/');

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
    return isAssetLibraryPath(path);
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

const ontologyProvenanceHash = (projectRoot: string): string =>
    digestIdentity(resolveOntologyProvenance(projectRoot));

function specSourcePath(projectRoot: string, specName: string): string {
    const directory = resolve(projectRoot, 'src', 'spec', specName);
    return existsSync(directory) ? directory : `${directory}.ts`;
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
            specSourcePath(options.projectRoot, options.specName)
        ], {
            include: path => !path.endsWith('.test.ts') && !path.endsWith('.test.tsx')
        });
        const graphInputs = graphSourceInputs(options.graph);
        const files = new Map(Object.entries(graphInputs.hashes));
        for (const identity of extraInputs) files.set(normalizePath(identity.path), identity.sha256);
        const workspace = captureGitInputObservation(
            options.projectRoot,
            Object.fromEntries(files)
        );
        if (!workspace) return null;
        return {
            schema_version: DEVELOPMENT_OBSERVATION_SCHEMA_VERSION,
            ...workspace,
            node_ids_by_file: graphInputs.nodeIdsByFile,
            entry_files_by_node: Object.fromEntries(radixSortUtf8(Object.keys(
                options.entryFilesByNode ?? {}
            )).map(nodeId => [
                nodeId,
                normalizePath(options.entryFilesByNode![nodeId])
            ])),
            renderer_environment: options.rendererEnvironment,
            ontology_provenance_sha256: ontologyProvenanceHash(options.projectRoot)
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
        candidateNodes: string[] = []
    ): DevelopmentObservationResult => ({
        clean: false,
        reason,
        candidate_files: candidateFiles,
        relevant_files_checked: checked,
        changed_files: changedFiles,
        candidate_nodes: candidateNodes
    });
    if (!previous || previous.schema_version !== DEVELOPMENT_OBSERVATION_SCHEMA_VERSION) {
        return miss('development observation is missing or unsupported');
    }
    if (previous.renderer_environment !== options.rendererEnvironment) {
        return miss('renderer environment changed');
    }
    if (previous.ontology_provenance_sha256 !== ontologyProvenanceHash(options.projectRoot)) {
        return miss('ontology provenance changed; authoritative graph reconstruction required');
    }

    const inspection = inspectGitInputObservation({
        projectRoot: options.projectRoot,
        previous,
        potentialRoots: [
            `src/spec/${options.specName}`,
            `src/spec/${options.specName}.ts`,
            'src/generators',
            'src/visuals/views',
            'public/icons'
        ],
        isPotentialInput: path => isPotentialNewInput(path, options.specName),
        inputName: 'graph input'
    });
    const candidateNodes = new Set(inspection.changed_files.flatMap(path =>
        previous.node_ids_by_file[path] ?? []));
    return {
        ...inspection,
        candidate_nodes: radixSortUtf8([...candidateNodes])
    };
}
