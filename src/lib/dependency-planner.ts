import {randomUUID} from 'node:crypto';
import {
    existsSync,
    mkdirSync,
    readFileSync,
    renameSync,
    rmSync,
    writeFileSync
} from 'node:fs';
import {resolve} from 'node:path';
import {digestContent, radixSortUtf8} from './content-identity.ts';

export const DEPENDENCY_GRAPH_SCHEMA_VERSION = 1;
export const DEPENDENCY_PLANNER_EPOCH = 2;

export const DEPENDENCY_NODE_KINDS = [
    'source-file',
    'generator-module',
    'view-module',
    'generator-view-pair',
    'competency-target',
    'ontology-entity',
    'ontology-relation',
    'external-standard',
    'dataset-shard',
    'image',
    'vqa-record',
    'asset-index-record',
    'coverage-record'
] as const;

export type DependencyNodeKind = typeof DEPENDENCY_NODE_KINDS[number];

export interface ContentAddressedOutput {
    content_hash: string;
    bytes?: number;
}

export interface DependencyNode {
    id: string;
    kind: DependencyNodeKind;
    input_hash: string;
    dependencies: string[];
    output?: ContentAddressedOutput;
}

export interface DependencyGraphSnapshot {
    schema_version: number;
    planner_epoch: number;
    complete: true;
    nodes: Record<string, DependencyNode>;
}

export interface DependencyCause {
    root: string;
    /** Previous node on the causal path; omitted on the changed root. */
    via?: string;
}

export interface DependencyDeltaPlan {
    clean: boolean;
    changed_roots: string[];
    removed_nodes: string[];
    affected_nodes: string[];
    rebuild_nodes: string[];
    reuse_nodes: string[];
    reusable_outputs: Record<string, ContentAddressedOutput>;
    schedule: string[];
    causes: Record<string, DependencyCause>;
    work: {
        current_nodes: number;
        previous_nodes: number;
        indexed_edges: number;
        closure_edge_visits: number;
        schedule_edge_visits: number;
    };
}

interface SnapshotEnvelope {
    schema_version: number;
    planner_epoch: number;
    snapshot_sha256: string;
    snapshot_bytes: number;
    complete: true;
}

const kindSet = new Set<string>(DEPENDENCY_NODE_KINDS);

function sameStrings(left: readonly string[], right: readonly string[]): boolean {
    if (left.length !== right.length) return false;
    for (let index = 0; index < left.length; index++) {
        if (left[index] !== right[index]) return false;
    }
    return true;
}

function normalizedNode(node: DependencyNode): DependencyNode {
    if (!node.id) throw new Error('Dependency node ids must be non-empty.');
    if (!kindSet.has(node.kind)) throw new Error(`Unsupported dependency node kind: ${node.kind}.`);
    if (!node.input_hash) throw new Error(`Dependency node ${node.id} has no input hash.`);
    const dependencies = radixSortUtf8([...new Set(node.dependencies)]);
    if (dependencies.includes(node.id)) throw new Error(`Dependency node ${node.id} depends on itself.`);
    if (node.output && !node.output.content_hash) {
        throw new Error(`Dependency node ${node.id} has an output without a content hash.`);
    }
    return {...node, dependencies};
}

/** Creates a canonical, complete graph after validating every direct edge. */
export function createDependencyGraphSnapshot(
    nodes: readonly DependencyNode[],
    plannerEpoch = DEPENDENCY_PLANNER_EPOCH
): DependencyGraphSnapshot {
    const byId = new Map<string, DependencyNode>();
    for (const rawNode of nodes) {
        const node = normalizedNode(rawNode);
        if (byId.has(node.id)) throw new Error(`Duplicate dependency node id: ${node.id}.`);
        byId.set(node.id, node);
    }
    for (const node of byId.values()) {
        for (const dependency of node.dependencies) {
            if (!byId.has(dependency)) {
                throw new Error(`Dependency node ${node.id} references missing node ${dependency}.`);
            }
        }
    }
    const ids = radixSortUtf8([...byId.keys()]);
    return {
        schema_version: DEPENDENCY_GRAPH_SCHEMA_VERSION,
        planner_epoch: plannerEpoch,
        complete: true,
        nodes: Object.fromEntries(ids.map(id => [id, byId.get(id)!]))
    };
}

function snapshotIsSupported(snapshot: DependencyGraphSnapshot): boolean {
    return snapshot.schema_version === DEPENDENCY_GRAPH_SCHEMA_VERSION
        && snapshot.planner_epoch === DEPENDENCY_PLANNER_EPOCH
        && snapshot.complete === true;
}

function nodeChanged(previous: DependencyNode, current: DependencyNode): boolean {
    return previous.kind !== current.kind
        || previous.input_hash !== current.input_hash
        || !sameStrings(previous.dependencies, current.dependencies);
}

function addReverseEdges(
    snapshot: DependencyGraphSnapshot,
    reverse: Map<string, string[]>
): number {
    let edges = 0;
    for (const node of Object.values(snapshot.nodes)) {
        for (const dependency of node.dependencies) {
            edges++;
            const dependents = reverse.get(dependency);
            if (dependents) dependents.push(node.id);
            else reverse.set(dependency, [node.id]);
        }
    }
    return edges;
}

function topologicalSchedule(
    snapshot: DependencyGraphSnapshot,
    affected: ReadonlySet<string>
): {schedule: string[]; edgeVisits: number} {
    const indegree = new Map<string, number>();
    const dependents = new Map<string, string[]>();
    let edgeVisits = 0;
    for (const id of affected) {
        const node = snapshot.nodes[id];
        if (!node) continue;
        let affectedDependencies = 0;
        for (const dependency of node.dependencies) {
            edgeVisits++;
            if (!affected.has(dependency) || !snapshot.nodes[dependency]) continue;
            affectedDependencies++;
            const children = dependents.get(dependency);
            if (children) children.push(id);
            else dependents.set(dependency, [id]);
        }
        indegree.set(id, affectedDependencies);
    }

    const ready = radixSortUtf8([...indegree.entries()]
        .filter(([, count]) => count === 0)
        .map(([id]) => id));
    const schedule: string[] = [];
    let cursor = 0;
    while (cursor < ready.length) {
        const id = ready[cursor++];
        schedule.push(id);
        for (const dependent of dependents.get(id) ?? []) {
            edgeVisits++;
            const next = indegree.get(dependent)! - 1;
            indegree.set(dependent, next);
            if (next === 0) ready.push(dependent);
        }
    }
    if (schedule.length !== indegree.size) {
        throw new Error('The affected dependency graph contains a cycle.');
    }
    return {schedule, edgeVisits};
}

/**
 * Computes the reverse affected closure using both snapshots. Previous edges
 * are required so removal or rewiring cannot strand a formerly dependent node.
 */
export function planDependencyDelta(
    previous: DependencyGraphSnapshot | null,
    current: DependencyGraphSnapshot
): DependencyDeltaPlan {
    if (!snapshotIsSupported(current)) {
        throw new Error('Current dependency graph has an unsupported schema, epoch, or completion state.');
    }
    const clean = !previous || !snapshotIsSupported(previous);
    const changedRoots = new Set<string>();
    const removed = new Set<string>();

    if (clean) {
        for (const id of Object.keys(current.nodes)) changedRoots.add(id);
        if (previous) {
            for (const id of Object.keys(previous.nodes)) {
                if (!current.nodes[id]) removed.add(id);
            }
        }
    } else {
        for (const [id, node] of Object.entries(current.nodes)) {
            const oldNode = previous.nodes[id];
            if (!oldNode || nodeChanged(oldNode, node)) changedRoots.add(id);
        }
        for (const id of Object.keys(previous.nodes)) {
            if (!current.nodes[id]) {
                changedRoots.add(id);
                removed.add(id);
            }
        }
    }

    const reverse = new Map<string, string[]>();
    let indexedEdges = addReverseEdges(current, reverse);
    if (previous) indexedEdges += addReverseEdges(previous, reverse);

    const affected = new Set<string>();
    const causes = new Map<string, DependencyCause>();
    const queue = [
        ...radixSortUtf8([...removed]),
        ...radixSortUtf8([...changedRoots].filter(id => !removed.has(id)))
    ];
    let closureEdgeVisits = 0;
    let cursor = 0;
    while (cursor < queue.length) {
        const id = queue[cursor++];
        if (affected.has(id)) continue;
        affected.add(id);
        const cause = causes.get(id) ?? {root: id};
        causes.set(id, cause);
        for (const dependent of reverse.get(id) ?? []) {
            closureEdgeVisits++;
            if (!causes.has(dependent)) {
                causes.set(dependent, {
                    root: cause.root,
                    via: id
                });
            }
            if (!affected.has(dependent)) queue.push(dependent);
        }
    }

    const currentAffected = new Set([...affected].filter(id => current.nodes[id]));
    const reuseNodes = radixSortUtf8(Object.keys(current.nodes).filter(id => !currentAffected.has(id)));
    const reusableOutputs: Record<string, ContentAddressedOutput> = {};
    if (previous && !clean) {
        for (const id of reuseNodes) {
            const output = previous.nodes[id]?.output;
            if (output) reusableOutputs[id] = output;
        }
    }
    const causeEntries = radixSortUtf8([...currentAffected])
        .map(id => [id, causes.get(id)!] as const);
    const scheduled = topologicalSchedule(current, currentAffected);
    return {
        clean,
        changed_roots: radixSortUtf8([...changedRoots]),
        removed_nodes: radixSortUtf8([...removed]),
        affected_nodes: radixSortUtf8([...currentAffected]),
        rebuild_nodes: [...scheduled.schedule],
        reuse_nodes: reuseNodes,
        reusable_outputs: reusableOutputs,
        schedule: scheduled.schedule,
        causes: Object.fromEntries(causeEntries),
        work: {
            current_nodes: Object.keys(current.nodes).length,
            previous_nodes: previous ? Object.keys(previous.nodes).length : 0,
            indexed_edges: indexedEdges,
            closure_edge_visits: closureEdgeVisits,
            schedule_edge_visits: scheduled.edgeVisits
        }
    };
}

export function explainAffectedNode(plan: DependencyDeltaPlan, nodeId: string): string | null {
    if (!plan.causes[nodeId]) return null;
    const reversed: string[] = [];
    const visited = new Set<string>();
    let current: string | undefined = nodeId;
    while (current) {
        if (visited.has(current)) throw new Error(`Causal path for ${nodeId} contains a cycle.`);
        visited.add(current);
        reversed.push(current);
        current = plan.causes[current]?.via;
    }
    return reversed.reverse().join(' -> ');
}

/**
 * Publishes a snapshot and integrity envelope as the last writes in a private
 * staging directory. The caller atomically promotes that directory only after
 * all affected artifacts have succeeded.
 */
export function writeDependencySnapshot(
    directory: string,
    snapshot: DependencyGraphSnapshot
): void {
    if (!snapshotIsSupported(snapshot)) {
        throw new Error('Cannot publish an unsupported or incomplete dependency graph.');
    }
    mkdirSync(directory, {recursive: true});
    const snapshotPath = resolve(directory, 'dependency-graph.json');
    const envelopePath = resolve(directory, 'dependency-graph.manifest.json');
    const snapshotContent = `${JSON.stringify(snapshot, null, 2)}\n`;
    const digest = digestContent(snapshotContent);
    const envelope: SnapshotEnvelope = {
        schema_version: DEPENDENCY_GRAPH_SCHEMA_VERSION,
        planner_epoch: DEPENDENCY_PLANNER_EPOCH,
        snapshot_sha256: digest.sha256,
        snapshot_bytes: digest.bytes,
        complete: true
    };
    const stage = resolve(directory, `.dependency-graph-${process.pid}-${randomUUID()}`);
    mkdirSync(stage);
    try {
        writeFileSync(resolve(stage, 'dependency-graph.json'), snapshotContent, 'utf-8');
        writeFileSync(
            resolve(stage, 'dependency-graph.manifest.json'),
            `${JSON.stringify(envelope, null, 2)}\n`,
            'utf-8'
        );
        renameSync(resolve(stage, 'dependency-graph.json'), snapshotPath);
        renameSync(resolve(stage, 'dependency-graph.manifest.json'), envelopePath);
    } finally {
        rmSync(stage, {recursive: true, force: true});
    }
}

export function readDependencySnapshot(directory: string): DependencyGraphSnapshot | null {
    const snapshotPath = resolve(directory, 'dependency-graph.json');
    const envelopePath = resolve(directory, 'dependency-graph.manifest.json');
    if (!existsSync(snapshotPath) && !existsSync(envelopePath)) return null;
    if (!existsSync(snapshotPath) || !existsSync(envelopePath)) {
        throw new Error(`Dependency graph at ${directory} is incomplete.`);
    }
    const snapshotContent = readFileSync(snapshotPath);
    const envelope = JSON.parse(readFileSync(envelopePath, 'utf-8')) as SnapshotEnvelope;
    const digest = digestContent(snapshotContent);
    if (envelope.schema_version !== DEPENDENCY_GRAPH_SCHEMA_VERSION
        || envelope.planner_epoch !== DEPENDENCY_PLANNER_EPOCH
        || envelope.complete !== true
        || envelope.snapshot_sha256 !== digest.sha256
        || envelope.snapshot_bytes !== digest.bytes) {
        throw new Error(`Dependency graph at ${directory} failed integrity verification.`);
    }
    const snapshot = JSON.parse(snapshotContent.toString('utf-8')) as DependencyGraphSnapshot;
    if (!snapshotIsSupported(snapshot)) {
        throw new Error(`Dependency graph at ${directory} is unsupported or incomplete.`);
    }
    return snapshot;
}
