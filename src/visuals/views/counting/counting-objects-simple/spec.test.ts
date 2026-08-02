import { describe, expect, it } from 'vitest';
import { Scope } from 'edugraph-ts';
import { extractConfig } from '../../../../lib/utils.ts';
import { setSeed } from '../../../../lib/random.ts';
import { CountingObjectsSimpleViewSchema } from './spec.ts';

describe('CountingObjectsSimpleViewSchema', () => {
    it('resolves box arrangement without changing the legacy arrangement fallback set', () => {
        setSeed(42);
        const { config } = extractConfig(CountingObjectsSimpleViewSchema, [Scope.BoxArrangement]);

        expect(config.isBoxArrangement).toBe(true);
        expect([
            Scope.LinearArrangement,
            Scope.CircularArrangement,
            Scope.ScatteredArrangement
        ]).toContain(config.arrangement);
    });

    it('keeps unlabeled arrangements out of box mode', () => {
        setSeed(42);
        const { config } = extractConfig(CountingObjectsSimpleViewSchema, []);

        expect(config.isBoxArrangement).toBe(false);
        expect(config.arrangement).not.toBe(Scope.BoxArrangement);
    });
});
