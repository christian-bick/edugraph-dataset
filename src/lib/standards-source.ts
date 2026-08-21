import {
    existsSync,
    mkdirSync,
    readFileSync,
    renameSync,
    rmSync,
    writeFileSync
} from 'node:fs';
import {resolve} from 'node:path';
import {digestContent, type ContentDigest} from './content-identity.ts';
import type {
    Cluster,
    Domain,
    DomainGroup,
    GradesTree,
    StandardNode,
    StandardsTreeData,
    TreeStandard
} from '../standards-explorer/types.ts';

export const EXTERNAL_SOURCE_LOCK_SCHEMA_VERSION = 1;
export const CCSS_SOURCE_FILES = ['standards.jsonl', 'domain_groups.json'] as const;

type CcssSourceFile = typeof CCSS_SOURCE_FILES[number];

export interface PinnedFileIdentity extends ContentDigest {
    path: CcssSourceFile;
}

export interface StandardsProvenance {
    provider: 'huggingface';
    repository: string;
    revision: string;
    files: PinnedFileIdentity[];
}

interface LockedFile {
    sha256: string;
    bytes: number;
}

interface ExternalSourceLock {
    schema_version: number;
    standards: {
        ccss: {
            provider: string;
            repository: string;
            revision: string;
            files: Record<string, LockedFile>;
        };
    };
}

export interface PinnedStandardsSource {
    tree: StandardsTreeData;
    provenance: StandardsProvenance;
    paths: Record<CcssSourceFile, string>;
}

export interface LoadPinnedStandardsOptions {
    projectRoot: string;
    cacheDir?: string;
    fetchFile?: (url: string) => Promise<Buffer>;
    report?: (message: string) => void;
}

const isSha256 = (value: unknown): value is string =>
    typeof value === 'string' && /^[a-f\d]{64}$/i.test(value);

const isRevision = (value: unknown): value is string =>
    typeof value === 'string' && /^[a-f\d]{40}$/i.test(value);

export function readPinnedStandardsProvenance(projectRoot: string): StandardsProvenance {
    const lockPath = resolve(projectRoot, 'config', 'external-sources.json');
    if (!existsSync(lockPath)) {
        throw new Error(`Pinned external-source lock is missing: ${lockPath}. External updates are ignored.`);
    }
    const lock = JSON.parse(readFileSync(lockPath, 'utf-8')) as Partial<ExternalSourceLock>;
    if (lock.schema_version !== EXTERNAL_SOURCE_LOCK_SCHEMA_VERSION) {
        throw new Error(`Unsupported external-source lock schema: ${lock.schema_version ?? 'missing'}.`);
    }
    const source = lock.standards?.ccss;
    if (!source
        || source.provider !== 'huggingface'
        || typeof source.repository !== 'string'
        || !/^[\w.-]+\/[\w.-]+$/.test(source.repository)
        || !isRevision(source.revision)) {
        throw new Error('The CCSS source must name a Hugging Face repository and an immutable 40-character revision.');
    }

    const files = CCSS_SOURCE_FILES.map(path => {
        const file = source.files?.[path];
        if (!file || !isSha256(file.sha256) || !Number.isSafeInteger(file.bytes) || file.bytes < 0) {
            throw new Error(`The pinned CCSS source has no valid digest contract for ${path}.`);
        }
        return {path, sha256: file.sha256.toLowerCase(), bytes: file.bytes};
    });
    return {
        provider: 'huggingface',
        repository: source.repository,
        revision: source.revision.toLowerCase(),
        files
    };
}

function exactFileMatches(path: string, expected: PinnedFileIdentity): boolean {
    if (!existsSync(path)) return false;
    const actual = digestContent(readFileSync(path));
    return actual.bytes === expected.bytes && actual.sha256 === expected.sha256;
}

const defaultFetchFile = async (url: string): Promise<Buffer> => {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP ${response.status} ${response.statusText}`);
    return Buffer.from(await response.arrayBuffer());
};

async function materializePinnedFile(options: {
    destination: string;
    sourceUrl: string;
    expected: PinnedFileIdentity;
    fetchFile: (url: string) => Promise<Buffer>;
}): Promise<void> {
    const {destination, sourceUrl, expected, fetchFile} = options;
    if (exactFileMatches(destination, expected)) return;

    const content = await fetchFile(sourceUrl).catch(error => {
        throw new Error(
            `Pinned external input ${expected.path} is unavailable at revision ${sourceUrl}. `
            + `The previously pinned revision remains authoritative; no mutable upstream fallback was used.`,
            {cause: error}
        );
    });
    const actual = digestContent(content);
    if (actual.bytes !== expected.bytes || actual.sha256 !== expected.sha256) {
        throw new Error(
            `Pinned external input ${expected.path} failed integrity verification: `
            + `expected ${expected.sha256}/${expected.bytes}, received ${actual.sha256}/${actual.bytes}.`
        );
    }

    const partial = `${destination}.partial-${process.pid}`;
    writeFileSync(partial, content);
    try {
        rmSync(destination, {force: true});
        renameSync(partial, destination);
    } finally {
        rmSync(partial, {force: true});
    }
}

const getDomainCategory = (id: string): string => {
    const parts = id.split('.');
    const first = parts[0];
    if (first.startsWith('HS')) return first.charAt(2) || '';
    if (/^[NAFGS]-/.test(first)) return first.charAt(0);
    return parts[1] || '';
};

interface DomainGroupIndexNode {
    children: Map<string, DomainGroupIndexNode>;
    terminalOrder?: number;
    subtreeOrder?: number;
}

const lowerOrder = (current: number | undefined, candidate: number): number =>
    current === undefined ? candidate : Math.min(current, candidate);

function buildDomainGroupIndex(
    domainGroups: Record<string, {description: string; domain_cats?: string[]}>
): {root: DomainGroupIndexNode; names: string[]} {
    const root: DomainGroupIndexNode = {children: new Map()};
    const names: string[] = [];
    for (const [name, group] of Object.entries(domainGroups)) {
        const order = names.length;
        names.push(name);
        for (const category of group.domain_cats ?? []) {
            let node = root;
            node.subtreeOrder = lowerOrder(node.subtreeOrder, order);
            for (const character of category) {
                let child = node.children.get(character);
                if (!child) {
                    child = {children: new Map()};
                    node.children.set(character, child);
                }
                node = child;
                node.subtreeOrder = lowerOrder(node.subtreeOrder, order);
            }
            node.terminalOrder = lowerOrder(node.terminalOrder, order);
        }
    }
    return {root, names};
}

const findDomainGroup = (
    domainCategory: string,
    index: ReturnType<typeof buildDomainGroupIndex>
): string => {
    if (!domainCategory) return 'Other';
    let node: DomainGroupIndexNode | undefined = index.root;
    let matchingOrder: number | undefined;
    for (const character of domainCategory) {
        if (node.terminalOrder !== undefined) {
            matchingOrder = lowerOrder(matchingOrder, node.terminalOrder);
        }
        node = node.children.get(character);
        if (!node) break;
    }
    if (node) {
        if (node.terminalOrder !== undefined) {
            matchingOrder = lowerOrder(matchingOrder, node.terminalOrder);
        }
        if (node.subtreeOrder !== undefined) {
            matchingOrder = lowerOrder(matchingOrder, node.subtreeOrder);
        }
    }
    return matchingOrder === undefined ? 'Other' : index.names[matchingOrder];
};

const gradeFor = (id: string): string => {
    const first = id.split('.')[0];
    if (first.startsWith('HS') || /^[NAFGS]-/.test(first)) return 'High School';
    if (first === 'K') return 'Kindergarten';
    if (/^[1-8]$/.test(first)) return `Grade ${first}`;
    return 'Other';
};

export function buildStandardsTree(
    standards: StandardNode[],
    domainGroups: Record<string, {description: string; domain_cats?: string[]}>
): StandardsTreeData {
    const standardsMap = Object.fromEntries(standards.map(standard => [standard.id, standard]));
    const domainGroupIndex = buildDomainGroupIndex(domainGroups);
    const tree: GradesTree = {};
    const gradeOrder = [
        'Kindergarten', 'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4',
        'Grade 5', 'Grade 6', 'Grade 7', 'Grade 8', 'High School'
    ];
    for (const grade of gradeOrder) {
        tree[grade] = Object.fromEntries(Object.entries(domainGroups).map(([name, group]) => [
            name,
            {description: group.description, domains: {}} satisfies DomainGroup
        ]));
        tree[grade].Other = {description: 'Other concepts and miscellaneous standards.', domains: {}};
    }

    const clusters = standards.filter(standard => standard.level.toLowerCase() === 'cluster');
    const domainMap = new Map<string, Domain & {grade: string; group: string}>();
    for (const cluster of clusters) {
        if (!cluster.parent || domainMap.has(cluster.parent)) continue;
        const group = findDomainGroup(getDomainCategory(cluster.id), domainGroupIndex);
        domainMap.set(cluster.parent, {
            id: cluster.parent,
            name: `${cluster.parent} - ${group}`,
            grade: gradeFor(cluster.id),
            group,
            clusters: []
        });
    }

    const clusterMap = new Map<string, Cluster>();
    for (const standard of clusters) {
        const cluster: Cluster = {
            id: standard.id,
            description: standard.description,
            cluster_type: standard.cluster_type || 'major cluster',
            standards: []
        };
        clusterMap.set(standard.id, cluster);
        if (standard.parent) domainMap.get(standard.parent)?.clusters.push(cluster);
    }

    const standardUiMap = new Map<string, TreeStandard>();
    for (const standard of standards.filter(item => item.level.toLowerCase() === 'standard')) {
        const treeStandard: TreeStandard = {
            id: standard.id,
            description: standard.description,
            aspects: standard.aspects,
            modeling: standard.modeling,
            subStandards: []
        };
        standardUiMap.set(standard.id, treeStandard);
        if (standard.parent) clusterMap.get(standard.parent)?.standards.push(treeStandard);
    }

    for (const standard of standards.filter(item => item.level.toLowerCase() === 'sub-standard')) {
        if (!standard.parent) continue;
        standardUiMap.get(standard.parent)?.subStandards.push({
            id: standard.id,
            description: standard.description,
            aspects: standard.aspects,
            modeling: standard.modeling
        });
    }

    for (const domain of domainMap.values()) {
        const group = tree[domain.grade]?.[domain.group];
        if (group) group.domains[domain.id] = {
            id: domain.id,
            name: domain.name,
            clusters: domain.clusters
        };
    }
    for (const grade of Object.values(tree)) {
        for (const [name, group] of Object.entries(grade)) {
            if (Object.keys(group.domains).length === 0) delete grade[name];
        }
    }
    return {tree, standardsMap};
}

export async function loadPinnedStandardsSource(
    options: LoadPinnedStandardsOptions
): Promise<PinnedStandardsSource> {
    const provenance = readPinnedStandardsProvenance(options.projectRoot);
    const cacheDir = options.cacheDir ?? resolve(options.projectRoot, 'temp', 'common-core');
    const fetchFile = options.fetchFile ?? defaultFetchFile;
    mkdirSync(cacheDir, {recursive: true});

    const paths = Object.fromEntries(CCSS_SOURCE_FILES.map(path => [path, resolve(cacheDir, path)])) as
        Record<CcssSourceFile, string>;
    for (const expected of provenance.files) {
        const sourceUrl = `https://huggingface.co/datasets/${provenance.repository}`
            + `/resolve/${provenance.revision}/${expected.path}`;
        await materializePinnedFile({
            destination: paths[expected.path],
            sourceUrl,
            expected,
            fetchFile
        });
    }

    options.report?.(
        `Using pinned CCSS source ${provenance.repository}@${provenance.revision}; `
        + 'unpinned upstream changes are ignored until an explicit delta update advances the lock.'
    );
    const standards = readFileSync(paths['standards.jsonl'], 'utf-8')
        .split('\n')
        .filter(Boolean)
        .map(line => JSON.parse(line) as StandardNode);
    const domainGroups = JSON.parse(readFileSync(paths['domain_groups.json'], 'utf-8')) as
        Record<string, {description: string; domain_cats?: string[]}>;
    return {
        tree: buildStandardsTree(standards, domainGroups),
        provenance,
        paths
    };
}
