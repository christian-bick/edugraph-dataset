import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import type { VqaCacheEntry } from './vqa-cache.ts';
import { auditVqaCache, type ExpectedVqaCacheRecord } from './vqa-cache-audit.ts';

const roots: string[] = [];

function cacheEntry(overrides: Partial<VqaCacheEntry> = {}): VqaCacheEntry {
    return {
        validation_cache_key: 'key-a',
        sample_key: 'target#writing#view#train#question#inst:0',
        target_id: 'target',
        generator: 'writing',
        view: 'view',
        mode: 'question',
        instance: 0,
        attempt: 1,
        seed: 1,
        file_name: 'writing/a.png',
        image_sha256: 'image',
        checklist_hash: 'checklist',
        label_context_hash: 'labels',
        validation_context_hash: 'context',
        validated_at: '2026-08-08T00:00:00Z',
        evaluation: { pass: true, reasoning: 'ok', label_checks: [] },
        ...overrides
    };
}

function fixture(linesByModule: Record<string, string[]>): string {
    const root = mkdtempSync(resolve(tmpdir(), 'edugraph-vqa-audit-'));
    roots.push(root);
    for (const [moduleName, lines] of Object.entries(linesByModule)) {
        mkdirSync(root, { recursive: true });
        writeFileSync(resolve(root, `${moduleName}.jsonl`), `${lines.join('\n')}\n`);
    }
    return root;
}

const expected: ExpectedVqaCacheRecord[] = [{
    moduleName: 'writing',
    validationCacheKey: 'key-a',
    sampleKey: 'target#writing#view#train#question#inst:0'
}];

afterEach(() => {
    for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true });
});

describe('auditVqaCache', () => {
    it('accepts exact passing coverage without modifying the cache', () => {
        const root = fixture({ writing: [JSON.stringify(cacheEntry())] });
        const before = readFileSync(resolve(root, 'writing.jsonl'), 'utf-8');
        const result = auditVqaCache(root, expected);
        expect(result).toMatchObject({ expected: 1, passed: 1, issues: [] });
        expect(readFileSync(resolve(root, 'writing.jsonl'), 'utf-8')).toBe(before);
    });

    it('reports missing, failing, and stale records', () => {
        const root = fixture({ writing: [JSON.stringify(cacheEntry({
            validation_cache_key: 'stale-key',
            evaluation: { pass: false, reasoning: 'bad', label_checks: [] }
        }))] });
        const result = auditVqaCache(root, expected);
        expect(result.counts.missing).toBe(1);
        expect(result.counts.stale).toBe(1);
    });

    it('reports malformed, duplicate, and obsolete module files', () => {
        const valid = JSON.stringify(cacheEntry());
        const root = fixture({
            writing: [valid, valid, '{bad json'],
            removed: [JSON.stringify(cacheEntry({ generator: 'removed' }))]
        });
        const result = auditVqaCache(root, expected);
        expect(result.counts.duplicate).toBe(1);
        expect(result.counts.malformed).toBe(1);
        expect(result.counts['obsolete-module']).toBe(1);
    });

    it('reports an expected cache record whose evaluation failed', () => {
        const root = fixture({ writing: [JSON.stringify(cacheEntry({
            evaluation: { pass: false, reasoning: 'bad', label_checks: [] }
        }))] });
        const result = auditVqaCache(root, expected);
        expect(result.counts.failing).toBe(1);
        expect(result.passed).toBe(0);
    });
});

