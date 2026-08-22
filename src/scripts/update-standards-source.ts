import {mkdirSync, readFileSync, renameSync, rmSync, writeFileSync} from 'node:fs';
import {dirname, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {digestIdentity, radixSortUtf8} from '../lib/content-identity.ts';
import {
    buildStandardsTree,
    canonicalStandardsTreePath,
    CCSS_SOURCE_FILES,
    CCSS_SOURCE_REPOSITORY,
    readCanonicalStandardsTree
} from '../lib/standards-source.ts';
import type {StandardNode} from '../standards-explorer/types.ts';

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const args = process.argv.slice(2);
const option = (name: string): string | undefined =>
    args.find(argument => argument.startsWith(`--${name}=`))?.slice(name.length + 3);
const apply = args.includes('--apply');
const revision = option('revision');
const sourceDir = option('source-dir');
const repository = option('repository') ?? CCSS_SOURCE_REPOSITORY;

function isRevision(value: string | undefined): value is string {
    return typeof value === 'string' && /^[a-f\d]{40}$/i.test(value);
}

async function fetchBytes(url: string): Promise<Buffer> {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP ${response.status} ${response.statusText}: ${url}`);
    return Buffer.from(await response.arrayBuffer());
}

function writeJsonAtomic(path: string, value: unknown): void {
    mkdirSync(dirname(path), {recursive: true});
    const partial = `${path}.partial-${process.pid}`;
    writeFileSync(partial, `${JSON.stringify(value, null, 2)}\n`, 'utf-8');
    try {
        renameSync(partial, path);
    } finally {
        rmSync(partial, {force: true});
    }
}

const summarize = (name: string, values: readonly string[]): void => {
    console.log(`${name}: ${values.length}`);
    for (const id of values.slice(0, 20)) console.log(`  ${id}`);
    if (values.length > 20) console.log(`  … and ${values.length - 20} more`);
};

async function main(): Promise<void> {
    if (!isRevision(revision)) {
        throw new Error('Usage: npm run update:standards-source -- --revision=<40-char-sha> [--apply].');
    }
    if (!/^[\w.-]+\/[\w.-]+$/.test(repository)) throw new Error(`Invalid source repository: ${repository}.`);

    const contents = new Map<string, Buffer>();
    for (const path of CCSS_SOURCE_FILES) {
        const bytes = sourceDir
            ? readFileSync(resolve(projectRoot, sourceDir, path))
            : await fetchBytes(
                `https://huggingface.co/datasets/${repository}/resolve/${revision}/${path}`
            );
        contents.set(path, bytes);
    }
    const standards = contents.get('standards.jsonl')!.toString('utf-8')
        .split('\n')
        .filter(Boolean)
        .map(line => JSON.parse(line) as StandardNode);
    const domainGroups = JSON.parse(contents.get('domain_groups.json')!.toString('utf-8')) as
        Record<string, {description: string; domain_cats?: string[]}>;
    const candidate = buildStandardsTree(standards, domainGroups);
    const previous = readCanonicalStandardsTree(projectRoot);
    const previousIds = new Set(Object.keys(previous.standardsMap));
    const candidateIds = new Set(Object.keys(candidate.standardsMap));
    const added = radixSortUtf8([...candidateIds].filter(id => !previousIds.has(id)));
    const removed = radixSortUtf8([...previousIds].filter(id => !candidateIds.has(id)));
    const changed = radixSortUtf8([...candidateIds].filter(id =>
        previousIds.has(id)
        && digestIdentity(previous.standardsMap[id]) !== digestIdentity(candidate.standardsMap[id])));
    const treeChanged = digestIdentity(previous.tree) !== digestIdentity(candidate.tree);

    console.log(`Canonical standards-tree delta from ${repository}@${revision.toLowerCase()}`);
    summarize('Added standards', added);
    summarize('Changed standards', changed);
    summarize('Removed standards', removed);
    console.log(`Tree/documentation structure changed: ${treeChanged ? 'yes' : 'no'}`);
    console.log(`[Work counters] ${JSON.stringify({
        previous_standards: previousIds.size,
        current_standards: candidateIds.size,
        records_compared: previousIds.size + candidateIds.size
    })}`);
    if (!apply) {
        console.log('Dry run only. Pass --apply to replace the tracked canonical standards tree.');
        return;
    }

    writeJsonAtomic(canonicalStandardsTreePath(projectRoot), candidate);
    console.log(`Applied canonical standards-tree update from ${repository}@${revision.toLowerCase()}.`);
}

main().catch(error => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
});
