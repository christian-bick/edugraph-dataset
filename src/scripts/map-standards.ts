import 'dotenv/config';
import fs from 'node:fs';
import https from 'node:https';
import path from 'node:path';
import type {IncomingMessage} from 'node:http';
import {fileURLToPath} from 'node:url';
import {
    buildCoverageManifest,
    buildCurrentStandardsCoverage,
    parseStandardsTree,
    resolveOntologyVersion
} from '../lib/standards-coverage.ts';
import type {
    Cluster,
    DataView,
    Domain,
    DomainGroup,
    GradesTree,
    StandardNode,
    StandardsTreeData,
    TreeStandard
} from '../standards-explorer/types.ts';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const tempDir = path.resolve(projectRoot, 'temp', 'common-core');
const standardsPath = path.join(tempDir, 'standards.jsonl');
const domainsPath = path.join(tempDir, 'domain_groups.json');
const args = process.argv.slice(2);
const readOption = (name: string): string | undefined =>
    args.find(arg => arg.startsWith(`--${name}=`))?.slice(name.length + 3);
const outputDir = path.resolve(projectRoot, readOption('output-dir') || path.join('public', 'coverage', 'preview'));
const channel = (readOption('channel') || 'preview') as DataView;
const sourceRef = readOption('source-ref') || process.env.GITHUB_REF_NAME || 'working-tree';
const sourceSha = readOption('source-sha') || process.env.GITHUB_SHA || 'working-tree';

if (channel !== 'latest' && channel !== 'preview') {
    throw new Error(`Invalid --channel=${channel}. Expected "latest" or "preview".`);
}

const standardsUrl = 'https://huggingface.co/datasets/allenai/achieve-the-core/raw/main/standards.jsonl';
const domainsUrl = 'https://huggingface.co/datasets/allenai/achieve-the-core/raw/main/domain_groups.json';

function downloadFile(url: string, destination: string): Promise<void> {
    return new Promise((resolve, reject) => {
        console.log(`Downloading ${url} to ${destination}...`);
        const file = fs.createWriteStream(destination);
        https.get(url, (response: IncomingMessage) => {
            if (response.statusCode !== 200) {
                file.close();
                fs.unlink(destination, () => undefined);
                reject(new Error(`Failed to download file: status code ${response.statusCode}`));
                return;
            }
            response.pipe(file);
            file.on('finish', () => {
                file.close();
                resolve();
            });
        }).on('error', error => {
            file.close();
            fs.unlink(destination, () => undefined);
            reject(error);
        });
    });
}

const getDomainCategory = (id: string): string => {
    const parts = id.split('.');
    const first = parts[0];
    if (first.startsWith('HS')) return first.charAt(2) || '';
    if (/^[NAFGS]-/.test(first)) return first.charAt(0);
    return parts[1] || '';
};

const findDomainGroup = (
    domainCategory: string,
    domainGroups: Record<string, {description: string; domain_cats?: string[]}>
): string => {
    if (!domainCategory) return 'Other';
    const exact = Object.entries(domainGroups).find(([, group]) =>
        group.domain_cats?.includes(domainCategory));
    if (exact) return exact[0];
    return Object.entries(domainGroups).find(([, group]) =>
        group.domain_cats?.some(category =>
            domainCategory.startsWith(category) || category.startsWith(domainCategory)))?.[0] ?? 'Other';
};

const gradeFor = (id: string): string => {
    const first = id.split('.')[0];
    if (first.startsWith('HS') || /^[NAFGS]-/.test(first)) return 'High School';
    if (first === 'K') return 'Kindergarten';
    if (/^[1-8]$/.test(first)) return `Grade ${first}`;
    return 'Other';
};

function buildStandardsTree(
    standards: StandardNode[],
    domainGroups: Record<string, {description: string; domain_cats?: string[]}>
): StandardsTreeData {
    const standardsMap = Object.fromEntries(standards.map(standard => [standard.id, standard]));
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
        const group = findDomainGroup(getDomainCategory(cluster.id), domainGroups);
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

async function prepareStandardsTree(): Promise<StandardsTreeData> {
    fs.mkdirSync(tempDir, {recursive: true});
    if (!fs.existsSync(standardsPath)) await downloadFile(standardsUrl, standardsPath);
    if (!fs.existsSync(domainsPath)) await downloadFile(domainsUrl, domainsPath);
    const standards = fs.readFileSync(standardsPath, 'utf-8')
        .split('\n')
        .filter(Boolean)
        .map(line => JSON.parse(line) as StandardNode);
    const domainGroups = JSON.parse(fs.readFileSync(domainsPath, 'utf-8')) as
        Record<string, {description: string; domain_cats?: string[]}>;
    return buildStandardsTree(standards, domainGroups);
}

async function main() {
    console.log('--- Initiating CCSS Ontology Mapping Pipeline ---');
    const tree = parseStandardsTree(await prepareStandardsTree());
    const packageJson = JSON.parse(fs.readFileSync(path.resolve(projectRoot, 'package.json'), 'utf-8'));
    const ontologyVersion = resolveOntologyVersion(packageJson);
    const generatedAt = new Date().toISOString();
    const coverage = await buildCurrentStandardsCoverage({
        standardsMap: tree.standardsMap,
        ontologyVersion,
        generatedAt,
        grade: readOption('grade'),
        excludeHighSchool: args.includes('--k8') || args.includes('--exclude-hs')
    });
    const manifest = buildCoverageManifest({
        channel,
        sourceRef,
        sourceSha,
        ontologyVersion,
        generatedAt
    });

    fs.mkdirSync(outputDir, {recursive: true});
    fs.writeFileSync(path.join(outputDir, 'ccss-tree.json'), JSON.stringify(tree, null, 2));
    fs.writeFileSync(path.join(outputDir, 'ccss-coverage.json'), JSON.stringify(coverage, null, 2));
    fs.writeFileSync(path.join(outputDir, 'coverage-manifest.json'), JSON.stringify(manifest, null, 2));

    console.log(`Mapping pipeline complete: ${coverage.metadata.covered_count}/${coverage.metadata.total_leaves_scanned} covered.`);
}

main().catch(error => {
    console.error(error);
    process.exitCode = 1;
});
