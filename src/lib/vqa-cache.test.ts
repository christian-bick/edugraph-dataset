import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { existsSync, rmSync, readFileSync, writeFileSync, mkdirSync } from 'fs';
import { resolve } from 'path';
import {
    computeChecklistHash,
    computeLabelContextHash,
    computeValidationContextHash,
    computeImageSha256,
    computeValidationCacheKey,
    buildVqaValidationContext,
    pruneObsoleteVqaCacheFiles,
    resolveVqaLabelDefinitions,
    VqaCacheManager,
    VqaCacheEntry
} from './vqa-cache.ts';

const TEST_CACHE_DIR = resolve(__dirname, '../../temp/test-vqa-cache');

function makeEntry(overrides: Partial<VqaCacheEntry>): VqaCacheEntry {
    return {
        validation_cache_key: 'val_key',
        sample_key: 'test-target-0#test-module#test-view#train#question#inst:0',
        target_id: 'test-target-0',
        generator: 'test-module',
        view: 'test-view',
        mode: 'question',
        instance: 0,
        attempt: 1,
        seed: 12345,
        file_name: 'test/sample.png',
        image_sha256: 'img',
        checklist_hash: 'check',
        label_context_hash: 'labels',
        validation_context_hash: 'context',
        validated_at: '2026-07-22T00:00:00Z',
        evaluation: { pass: true, reasoning: '', label_checks: [] },
        ...overrides
    };
}

describe('VQA Cache Module', () => {
    beforeEach(() => {
        if (existsSync(TEST_CACHE_DIR)) {
            rmSync(TEST_CACHE_DIR, { recursive: true, force: true });
        }
        mkdirSync(TEST_CACHE_DIR, { recursive: true });
    });

    afterEach(() => {
        if (existsSync(TEST_CACHE_DIR)) {
            rmSync(TEST_CACHE_DIR, { recursive: true, force: true });
        }
    });

    it('should compute deterministic validation cache keys', () => {
        const fileA = resolve(TEST_CACHE_DIR, 'a.md');
        const fileB = resolve(TEST_CACHE_DIR, 'b.md');
        writeFileSync(fileA, '# Checklist A\n- check 1');
        writeFileSync(fileB, '# Checklist B\n- check 2');

        const checklistHash = computeChecklistHash([fileA, fileB]);
        expect(checklistHash.length).toBe(16);

        const imgBuffer = Buffer.from('fake-png-bytes');
        const imgHash = computeImageSha256(imgBuffer);
        expect(imgHash.length).toBe(64);

        const labelDefinitions = resolveVqaLabelDefinitions(['NumbersWithZero']);
        const labelContextHash = computeLabelContextHash(labelDefinitions);
        const validationContextHash = computeValidationContextHash(checklistHash, labelContextHash);
        const valKey = computeValidationCacheKey(imgHash, validationContextHash);
        expect(valKey.length).toBe(64);
        expect(computeValidationCacheKey(imgHash, validationContextHash)).toBe(valKey);

        const context = buildVqaValidationContext(imgHash, [fileA, fileB], ['NumbersWithZero']);
        expect(context.validationCacheKey).toBe(valKey);
        expect(context.labelDefinitions).toEqual([{
            iri: 'http://edugraph.io/edu/NumbersWithZero',
            label: 'NumbersWithZero',
            definition: 'Involves zero as a number.'
        }]);
    });

    it('should normalize, deduplicate, and sort label definitions', () => {
        const definitions = resolveVqaLabelDefinitions([
            'NumbersWithoutZero',
            'http://edugraph.io/edu/NumbersWithZero',
            'NumbersWithoutZero'
        ]);

        expect(definitions.map(item => item.label)).toEqual(['NumbersWithoutZero', 'NumbersWithZero']);
        expect(definitions[0].definition).toBe('Does not involve zero as a number.');
    });

    it('should reject ontology labels without definitions', () => {
        expect(() => resolveVqaLabelDefinitions(['NotAnOntologyLabel']))
            .toThrow('Cannot visually validate ontology label without a definition');
    });

    it('should invalidate the context when labels or definitions change', () => {
        const withZero = resolveVqaLabelDefinitions(['NumbersWithZero']);
        const withoutZero = resolveVqaLabelDefinitions(['NumbersWithoutZero']);

        expect(computeLabelContextHash(withZero)).not.toBe(computeLabelContextHash(withoutZero));
        expect(computeLabelContextHash(withZero)).not.toBe(computeLabelContextHash([
            { ...withZero[0], definition: 'Changed definition.' }
        ]));
    });

    it('should store and load VqaCacheEntries in dataset-partitioned folder', () => {
        const manager = new VqaCacheManager(TEST_CACHE_DIR, 'dataset-test', 'test-module');
        expect(manager.size).toBe(0);

        const entry1 = makeEntry({
            validation_cache_key: 'b_val_key',
            file_name: 'test/sample2.png',
            evaluation: { pass: true, reasoning: 'Sample 2 passed', label_checks: [] }
        });
        const entry2 = makeEntry({
            validation_cache_key: 'a_val_key',
            file_name: 'test/sample1.png',
            evaluation: { pass: false, reasoning: 'Sample 1 failed', label_checks: [] }
        });

        manager.set(entry1);
        manager.set(entry2);
        expect(manager.size).toBe(2);
        manager.save();

        const savedFile = resolve(TEST_CACHE_DIR, 'dataset-test', 'test-module.jsonl');
        expect(existsSync(savedFile)).toBe(true);

        const lines = readFileSync(savedFile, 'utf-8').trim().split('\n');
        expect(lines.length).toBe(2);

        // Test reloading in a new manager
        const manager2 = new VqaCacheManager(TEST_CACHE_DIR, 'dataset-test', 'test-module');
        expect(manager2.size).toBe(2);
        expect(manager2.get('a_val_key')?.evaluation.reasoning).toBe('Sample 1 failed');
        expect(manager2.get('a_val_key')?.sample_key).toBe(entry2.sample_key);
        expect(manager2.get('a_val_key')?.attempt).toBe(1);
    });

    it('should append immediately to disk on set() call for crash resilience', () => {
        const manager = new VqaCacheManager(TEST_CACHE_DIR, 'dataset-test', 'crash-test');

        const entry = makeEntry({
            validation_cache_key: 'crash_val_key',
            file_name: 'test/crash.png'
        });

        // Call set() without explicit save()
        manager.set(entry);

        const savedFile = resolve(TEST_CACHE_DIR, 'dataset-test', 'crash-test.jsonl');
        expect(existsSync(savedFile)).toBe(true);

        const content = readFileSync(savedFile, 'utf-8');
        expect(content).toContain('crash_val_key');

        // New instance immediately sees crash_val_key from disk
        const manager2 = new VqaCacheManager(TEST_CACHE_DIR, 'dataset-test', 'crash-test');
        expect(manager2.get('crash_val_key')).toBeDefined();
    });

    it('should automatically prune stale keys not in active set', () => {
        const manager = new VqaCacheManager(TEST_CACHE_DIR, 'dataset-test', 'test-module');

        manager.set(makeEntry({ validation_cache_key: 'active_val_key', file_name: 'test/sample1.png' }));
        manager.set(makeEntry({ validation_cache_key: 'stale_val_key', file_name: 'test/sample2.png' }));
        manager.save();

        const activeKeys = new Set(['active_val_key']);
        const pruned = manager.prune(activeKeys);

        expect(pruned).toBe(1);
        expect(manager.size).toBe(1);
        expect(manager.get('active_val_key')).toBeDefined();
        expect(manager.get('stale_val_key')).toBeUndefined();
    });

    it('should remove cache files for modules absent from a complete dataset', () => {
        const datasetCacheDir = resolve(TEST_CACHE_DIR, 'dataset-test');
        mkdirSync(datasetCacheDir, { recursive: true });
        writeFileSync(resolve(datasetCacheDir, 'active.jsonl'), '');
        writeFileSync(resolve(datasetCacheDir, 'obsolete.jsonl'), '');

        expect(pruneObsoleteVqaCacheFiles(datasetCacheDir, new Set(['active']))).toEqual(['obsolete']);
        expect(existsSync(resolve(datasetCacheDir, 'active.jsonl'))).toBe(true);
        expect(existsSync(resolve(datasetCacheDir, 'obsolete.jsonl'))).toBe(false);
    });
});
