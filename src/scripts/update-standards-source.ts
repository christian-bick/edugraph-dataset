import {mkdirSync, readFileSync, renameSync, rmSync, writeFileSync} from 'node:fs';
import {dirname, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {digestContent} from '../lib/content-identity.ts';
import {
    buildStandardsSemanticSnapshot,
    diffStandardsSemantics,
    readStandardsSemanticSnapshot,
    STANDARDS_SEMANTICS_PATH
} from '../lib/external-semantics.ts';
import {
    CCSS_SOURCE_FILES,
    readPinnedStandardsProvenance,
    type StandardsProvenance
} from '../lib/standards-source.ts';
import type {StandardNode} from '../standards-explorer/types.ts';

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const args = process.argv.slice(2);
const option = (name: string): string | undefined =>
    args.find(argument => argument.startsWith(`--${name}=`))?.slice(name.length + 3);
const apply = args.includes('--apply');
const revision = option('revision');
const sourceDir = option('source-dir');

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
    const pinned = readPinnedStandardsProvenance(projectRoot);
    const candidateRevision = revision ?? pinned.revision;
    if (!isRevision(candidateRevision)) {
        throw new Error('Usage: npm run update:standards-source -- --revision=<40-char-sha> [--apply].');
    }

    const contents = new Map<string, Buffer>();
    for (const path of CCSS_SOURCE_FILES) {
        const bytes = sourceDir
            ? readFileSync(resolve(projectRoot, sourceDir, path))
            : await fetchBytes(
                `https://huggingface.co/datasets/${pinned.repository}/resolve/${candidateRevision}/${path}`
            );
        contents.set(path, bytes);
    }
    const provenance: StandardsProvenance = {
        provider: 'huggingface',
        repository: pinned.repository,
        revision: candidateRevision.toLowerCase(),
        files: CCSS_SOURCE_FILES.map(path => ({path, ...digestContent(contents.get(path)!)}))
    };
    const standards = contents.get('standards.jsonl')!.toString('utf-8')
        .split('\n')
        .filter(Boolean)
        .map(line => JSON.parse(line) as StandardNode);
    const domainGroups = JSON.parse(contents.get('domain_groups.json')!.toString('utf-8')) as
        Record<string, unknown>;
    const candidate = buildStandardsSemanticSnapshot({standards, domainGroups, provenance});
    const previous = readStandardsSemanticSnapshot(projectRoot);
    const delta = diffStandardsSemantics(previous, candidate);

    console.log(`Standards semantic delta ${delta.from ?? '<none>'} -> ${delta.to}`);
    summarize('Added records', delta.records.added);
    summarize('Changed records', delta.records.changed);
    summarize('Removed records', delta.records.removed);
    console.log(`[Work counters] ${JSON.stringify(delta.work)}`);
    if (!apply) {
        console.log('Dry run only. Pass --apply to advance the pinned lock and semantic snapshot.');
        return;
    }

    const lockPath = resolve(projectRoot, 'config', 'external-sources.json');
    const lock = JSON.parse(readFileSync(lockPath, 'utf-8')) as {
        standards: {ccss: {revision: string; files: Record<string, {sha256: string; bytes: number}>}};
    };
    lock.standards.ccss.revision = provenance.revision;
    lock.standards.ccss.files = Object.fromEntries(provenance.files.map(file => [file.path, {
        sha256: file.sha256,
        bytes: file.bytes
    }]));

    // The semantic snapshot is staged first; the lock is the authoritative commit point.
    writeJsonAtomic(resolve(projectRoot, ...STANDARDS_SEMANTICS_PATH), candidate);
    writeJsonAtomic(lockPath, lock);
    console.log(`Applied standards update to ${provenance.revision}.`);
}

main().catch(error => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
});
