import {createHash} from 'node:crypto';
import {mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {resolve} from 'node:path';
import {describe, expect, it, vi} from 'vitest';
import {loadPinnedStandardsSource} from './standards-source.ts';

const sha256 = (value: string): string => createHash('sha256').update(value).digest('hex');

function fixture() {
    const projectRoot = mkdtempSync(resolve(tmpdir(), 'edugraph-standards-source-'));
    const cacheDir = resolve(projectRoot, 'cache');
    mkdirSync(resolve(projectRoot, 'config'));
    mkdirSync(cacheDir);
    const standards = `${JSON.stringify({
        id: 'K.CC.A',
        description: 'Cluster',
        level: 'Cluster',
        aspects: [],
        children: ['K.CC.A.1'],
        modeling: false
    })}\n${JSON.stringify({
        id: 'K.CC.A.1',
        description: 'Standard',
        level: 'Standard',
        parent: 'K.CC.A',
        aspects: [],
        children: [],
        modeling: false
    })}\n`;
    const domains = JSON.stringify({Counting: {description: 'Counting', domain_cats: ['CC']}});
    writeFileSync(resolve(projectRoot, 'config', 'external-sources.json'), JSON.stringify({
        schema_version: 1,
        standards: {
            ccss: {
                provider: 'huggingface',
                repository: 'example/standards',
                revision: 'a'.repeat(40),
                files: {
                    'standards.jsonl': {sha256: sha256(standards), bytes: Buffer.byteLength(standards)},
                    'domain_groups.json': {sha256: sha256(domains), bytes: Buffer.byteLength(domains)}
                }
            }
        }
    }));
    return {projectRoot, cacheDir, standards, domains};
}

describe('pinned standards source', () => {
    it('reuses only exact cached bytes and reports the frozen revision', async () => {
        const {projectRoot, cacheDir, standards, domains} = fixture();
        writeFileSync(resolve(cacheDir, 'standards.jsonl'), standards);
        writeFileSync(resolve(cacheDir, 'domain_groups.json'), domains);
        const fetchFile = vi.fn<(_: string) => Promise<Buffer>>();
        const report = vi.fn();

        try {
            const source = await loadPinnedStandardsSource({projectRoot, cacheDir, fetchFile, report});
            expect(fetchFile).not.toHaveBeenCalled();
            expect(source.provenance.revision).toBe('a'.repeat(40));
            expect(source.tree.standardsMap['K.CC.A.1'].description).toBe('Standard');
            expect(report).toHaveBeenCalledWith(expect.stringContaining('unpinned upstream changes are ignored'));
        } finally {
            rmSync(projectRoot, {recursive: true, force: true});
        }
    });

    it('repairs one corrupt cached file from the immutable revision', async () => {
        const {projectRoot, cacheDir, standards, domains} = fixture();
        writeFileSync(resolve(cacheDir, 'standards.jsonl'), 'corrupt');
        writeFileSync(resolve(cacheDir, 'domain_groups.json'), domains);
        const fetchFile = vi.fn(async (url: string) => {
            expect(url).toContain(`/resolve/${'a'.repeat(40)}/standards.jsonl`);
            return Buffer.from(standards);
        });

        try {
            await loadPinnedStandardsSource({projectRoot, cacheDir, fetchFile});
            expect(fetchFile).toHaveBeenCalledTimes(1);
            expect(readFileSync(resolve(cacheDir, 'standards.jsonl'), 'utf-8')).toBe(standards);
        } finally {
            rmSync(projectRoot, {recursive: true, force: true});
        }
    });

    it('rejects mutable revisions and downloaded bytes with the wrong digest', async () => {
        const first = fixture();
        const lockPath = resolve(first.projectRoot, 'config', 'external-sources.json');
        const lock = JSON.parse(readFileSync(lockPath, 'utf-8'));
        lock.standards.ccss.revision = 'main';
        writeFileSync(lockPath, JSON.stringify(lock));
        await expect(loadPinnedStandardsSource({
            projectRoot: first.projectRoot,
            cacheDir: first.cacheDir,
            fetchFile: async () => Buffer.from('wrong')
        })).rejects.toThrow('immutable 40-character revision');
        rmSync(first.projectRoot, {recursive: true, force: true});

        const second = fixture();
        try {
            await expect(loadPinnedStandardsSource({
                projectRoot: second.projectRoot,
                cacheDir: second.cacheDir,
                fetchFile: async () => Buffer.from('wrong')
            })).rejects.toThrow('failed integrity verification');
        } finally {
            rmSync(second.projectRoot, {recursive: true, force: true});
        }
    });
});
