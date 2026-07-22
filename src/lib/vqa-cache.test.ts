import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { existsSync, rmSync, readFileSync, writeFileSync, mkdirSync } from 'fs';
import { resolve } from 'path';
import {
    computeChecklistHash,
    computeImageSha256,
    computeValidationCacheKey,
    computeInputCacheKey,
    VqaCacheManager,
    VqaCacheEntry
} from './vqa-cache.ts';

const TEST_CACHE_DIR = resolve(__dirname, '../../temp/test-vqa-cache');

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

    it('should compute deterministic validation and input cache keys', () => {
        const fileA = resolve(TEST_CACHE_DIR, 'a.md');
        const fileB = resolve(TEST_CACHE_DIR, 'b.md');
        writeFileSync(fileA, '# Checklist A\n- check 1');
        writeFileSync(fileB, '# Checklist B\n- check 2');

        const checklistHash = computeChecklistHash([fileA, fileB]);
        expect(checklistHash.length).toBe(16);

        const imgBuffer = Buffer.from('fake-png-bytes');
        const imgHash = computeImageSha256(imgBuffer);
        expect(imgHash.length).toBe(64);

        const valKey = computeValidationCacheKey(imgHash, checklistHash);
        expect(valKey.length).toBe(64);

        const inputKey = computeInputCacheKey(
            'arithmetic-ops-pairs',
            'operations-vertical',
            'question',
            ['http://edugraph.io/edu/Scope.Addition'],
            0
        );
        expect(inputKey.length).toBe(64);
    });

    it('should store and load VqaCacheEntries in dataset-partitioned folder', () => {
        const manager = new VqaCacheManager(TEST_CACHE_DIR, 'dataset-test', 'test-module');
        expect(manager.size).toBe(0);

        const entry1: VqaCacheEntry = {
            validation_cache_key: 'b_val_key',
            input_cache_key: 'b_input_key',
            file_name: 'test/sample2.png',
            image_sha256: 'img-b',
            checklist_hash: 'check-b',
            validated_at: '2026-07-22T00:00:00Z',
            evaluation: {
                pass: true,
                reasoning: 'Sample 2 passed'
            }
        };

        const entry2: VqaCacheEntry = {
            validation_cache_key: 'a_val_key',
            input_cache_key: 'a_input_key',
            file_name: 'test/sample1.png',
            image_sha256: 'img-a',
            checklist_hash: 'check-a',
            validated_at: '2026-07-22T00:00:00Z',
            evaluation: {
                pass: false,
                reasoning: 'Sample 1 failed'
            }
        };

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
    });

    it('should append immediately to disk on set() call for crash resilience', () => {
        const manager = new VqaCacheManager(TEST_CACHE_DIR, 'dataset-test', 'crash-test');

        const entry: VqaCacheEntry = {
            validation_cache_key: 'crash_val_key',
            input_cache_key: 'crash_input_key',
            file_name: 'test/crash.png',
            image_sha256: 'img-crash',
            checklist_hash: 'check-crash',
            validated_at: '2026-07-22T00:00:00Z',
            evaluation: { pass: true, reasoning: 'Crash test sample' }
        };

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

        const entry1: VqaCacheEntry = {
            validation_cache_key: 'active_val_key',
            input_cache_key: 'active_input_key',
            file_name: 'test/sample1.png',
            image_sha256: 'img-a',
            checklist_hash: 'check-a',
            validated_at: '2026-07-22T00:00:00Z',
            evaluation: { pass: true, reasoning: 'Sample 1' }
        };

        const entry2: VqaCacheEntry = {
            validation_cache_key: 'stale_val_key',
            input_cache_key: 'stale_input_key',
            file_name: 'test/sample2.png',
            image_sha256: 'img-b',
            checklist_hash: 'check-b',
            validated_at: '2026-07-22T00:00:00Z',
            evaluation: { pass: true, reasoning: 'Sample 2' }
        };

        manager.set(entry1);
        manager.set(entry2);
        manager.save();

        const activeKeys = new Set(['active_val_key']);
        const pruned = manager.prune(activeKeys);

        expect(pruned).toBe(1);
        expect(manager.size).toBe(1);
        expect(manager.get('active_val_key')).toBeDefined();
        expect(manager.get('stale_val_key')).toBeUndefined();
    });
});
