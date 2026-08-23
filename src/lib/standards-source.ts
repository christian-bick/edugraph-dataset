import {readFileSync} from 'node:fs';
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

export const CCSS_SOURCE_FILES = ['standards.jsonl', 'domain_groups.json'] as const;
export const CCSS_SOURCE_REPOSITORY = 'allenai/achieve-the-core';
export const CANONICAL_STANDARDS_TREE_PATH = ['public', 'coverage', 'ccss-tree.json'] as const;

export interface CanonicalStandardsIdentity extends ContentDigest {
    path: 'public/coverage/ccss-tree.json';
}

export function canonicalStandardsTreePath(projectRoot: string): string {
    return resolve(projectRoot, ...CANONICAL_STANDARDS_TREE_PATH);
}

export function readCanonicalStandardsTree(projectRoot: string): StandardsTreeData {
    const path = canonicalStandardsTreePath(projectRoot);
    const parsed = JSON.parse(readFileSync(path, 'utf-8')) as Partial<StandardsTreeData>;
    if (!parsed.tree || typeof parsed.tree !== 'object'
        || !parsed.standardsMap || typeof parsed.standardsMap !== 'object') {
        throw new Error(`Canonical standards tree is invalid: ${path}.`);
    }
    return parsed as StandardsTreeData;
}

export function canonicalStandardsIdentity(projectRoot: string): CanonicalStandardsIdentity {
    return {
        path: 'public/coverage/ccss-tree.json',
        ...digestContent(readFileSync(canonicalStandardsTreePath(projectRoot)))
    };
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
