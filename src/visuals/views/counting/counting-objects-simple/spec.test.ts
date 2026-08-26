import { describe, expect, it } from 'vitest';
import { Scope } from 'edugraph-ts';
import { extractConfig } from '../../../../lib/utils.ts';
import { setSeed } from '../../../../lib/random.ts';
import { CountingObjectsSimpleViewSchema } from './spec.ts';

describe('CountingObjectsSimpleViewSchema', () => {
    it('resolves exactly one box arrangement capability', () => {
        setSeed(42);
        const {config, resolvedLabels} = extractConfig(
            CountingObjectsSimpleViewSchema,
            [Scope.BoxArrangement]
        );

        expect(config.arrangement).toBe(Scope.BoxArrangement);
        expect(resolvedLabels).toEqual([Scope.BoxArrangement]);
    });

    it.each([
        Scope.LinearArrangement,
        Scope.CircularArrangement,
        Scope.ScatteredArrangement
    ])('resolves %s without an additional arrangement label', arrangement => {
        const {config, resolvedLabels} = extractConfig(
            CountingObjectsSimpleViewSchema,
            [arrangement]
        );

        expect(config.arrangement).toBe(arrangement);
        expect(resolvedLabels).toEqual([arrangement]);
    });
});
