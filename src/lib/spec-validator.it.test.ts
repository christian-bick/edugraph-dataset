import {describe, expect, it} from 'vitest';
import {normalizeAndValidateSpec} from './spec-validator.ts';

describe('CCSS spec validation', () => {
    it('validates and deduplicates the committed standard', async () => {
        const result = await normalizeAndValidateSpec('ccss');
        expect(result.errors).toHaveLength(0);
        expect(result.stats.totalTargets).toBeGreaterThan(0);
        expect(result.stats.uniqueTargets).toBe(result.targets.length);
        expect(result.stats.totalTargets - result.stats.uniqueTargets).toBe(result.stats.deduplicatedCount);
        const ids = result.targets.map(target => target.id);
        expect(new Set(ids).size).toBe(ids.length);
        for (const target of result.targets) {
            expect(target.labels).toEqual([...new Set(target.labels)].sort());
        }
    }, 15_000);
});
