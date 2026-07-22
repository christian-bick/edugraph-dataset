import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { existsSync, rmSync, readFileSync, writeFileSync, mkdirSync } from 'fs';
import { resolve } from 'path';
import {
    computeChecklistHash,
    computeImageSha256,
    computeVqaCacheKey,
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

    it('should compute deterministic checklist and image SHA-256 hashes', () => {
        const fileA = resolve(TEST_CACHE_DIR, 'a.md');
        const fileB = resolve(TEST_CACHE_DIR, 'b.md');
        writeFileSync(fileA, '# Checklist A\n- check 1');
        writeFileSync(fileB, '# Checklist B\n- check 2');

        const hash1 = computeChecklistHash([fileA, fileB]);
        const hash2 = computeChecklistHash([fileA, fileB]);
        expect(hash1).toBe(hash2);
        expect(hash1.length).toBe(16);

        const imgBuffer = Buffer.from('fake-png-bytes');
        const imgHash = computeImageSha256(imgBuffer);
        expect(imgHash.length).toBe(64);

        const cacheKey = computeVqaCacheKey('target123', imgHash, hash1);
        expect(cacheKey.length).toBe(64);
    });

    it('should load, store, sort, and save VqaCacheEntries deterministically', () => {
        const manager = new VqaCacheManager(TEST_CACHE_DIR, 'test-module');
        expect(manager.size).toBe(0);

        const entry1: VqaCacheEntry = {
            cache_key: 'b_key',
            file_name: 'test/sample2.png',
            target_key_hash: 'target-b',
            image_sha256: 'img-b',
            checklist_hash: 'check-b',
            validated_at: '2026-07-22T00:00:00Z',
            evaluation: {
                pass: true,
                reasoning: 'Sample 2 passed'
            }
        };

        const entry2: VqaCacheEntry = {
            cache_key: 'a_key',
            file_name: 'test/sample1.png',
            target_key_hash: 'target-a',
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

        const savedFile = resolve(TEST_CACHE_DIR, 'test-module.jsonl');
        expect(existsSync(savedFile)).toBe(true);

        const lines = readFileSync(savedFile, 'utf-8').trim().split('\n');
        expect(lines.length).toBe(2);

        // Verify sorted by cache_key ('a_key' comes before 'b_key')
        const firstParsed = JSON.parse(lines[0]);
        const secondParsed = JSON.parse(lines[1]);
        expect(firstParsed.cache_key).toBe('a_key');
        expect(secondParsed.cache_key).toBe('b_key');

        // Test reloading in a new manager
        const manager2 = new VqaCacheManager(TEST_CACHE_DIR, 'test-module');
        expect(manager2.size).toBe(2);
        expect(manager2.get('a_key')?.evaluation.reasoning).toBe('Sample 1 failed');
    });
});
