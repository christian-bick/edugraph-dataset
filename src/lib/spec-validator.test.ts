import { describe, it, expect, afterEach } from 'vitest';
import { existsSync, mkdirSync, rmSync, writeFileSync } from 'fs';
import { resolve } from 'path';
import {
    labelSetKey,
    getTargetPrefix,
    validateUniqueTargetIds,
    normalizeTargetLabels,
    validateUniquePermutationsPerTarget,
    validateUniqueTargetPermutations,
    deduplicateTargetPermutations,
    normalizeAndValidateSpec
} from './spec-validator.ts';
import { CompetencyTarget } from '../types/ml-engine.ts';

describe('spec-validator', () => {
    describe('labelSetKey', () => {
        it('produces the same key regardless of label order', () => {
            expect(labelSetKey(['B', 'A'])).toBe(labelSetKey(['A', 'B']));
        });

        it('deduplicates labels before keying', () => {
            expect(labelSetKey(['A', 'A', 'B'])).toBe(labelSetKey(['A', 'B']));
        });

        it('never collides for different label sets, even with delimiter-like characters', () => {
            // A '|'-joined signature would make these two sets identical
            expect(labelSetKey(['a|b'])).not.toBe(labelSetKey(['a', 'b']));
        });

        it('distinguishes an empty label set from a set with an empty label', () => {
            expect(labelSetKey([])).not.toBe(labelSetKey(['']));
        });
    });

    describe('getTargetPrefix', () => {
        it('strips the ~<hash> permutation suffix', () => {
            expect(getTargetPrefix('K.CC.B.5-how-many~a3f91c2e')).toBe('K.CC.B.5-how-many');
        });

        it('strips only the last ~ segment', () => {
            expect(getTargetPrefix('a~b~c')).toBe('a~b');
        });

        it('returns the full ID when there is no ~ separator', () => {
            expect(getTargetPrefix('standalone')).toBe('standalone');
        });

        it('treats dash-suffixed IDs as their own definitions', () => {
            expect(getTargetPrefix('prefix-0')).toBe('prefix-0');
            expect(getTargetPrefix('1.NBT.C.4-add-within-100')).toBe('1.NBT.C.4-add-within-100');
        });

        it('does not treat a leading ~ as a separator', () => {
            expect(getTargetPrefix('~abc')).toBe('~abc');
        });
    });

    describe('validateUniqueTargetIds', () => {
        it('returns no errors when all target IDs are unique', () => {
            const targets: CompetencyTarget[] = [
                { id: 't-1', labels: ['L1'] },
                { id: 't-2', labels: ['L2'] }
            ];
            expect(validateUniqueTargetIds(targets)).toHaveLength(0);
        });

        it('returns an error when duplicate target IDs are present', () => {
            const targets: CompetencyTarget[] = [
                { id: 't-1', labels: ['L1'] },
                { id: 't-1', labels: ['L2'] }
            ];
            const errors = validateUniqueTargetIds(targets);
            expect(errors).toHaveLength(1);
            expect(errors[0]).toContain('Duplicate target ID "t-1"');
        });

        it('reports every repeated occurrence of an ID', () => {
            const targets: CompetencyTarget[] = [
                { id: 't-1', labels: ['L1'] },
                { id: 't-1', labels: ['L2'] },
                { id: 't-1', labels: ['L3'] }
            ];
            expect(validateUniqueTargetIds(targets)).toHaveLength(2);
        });
    });

    describe('normalizeTargetLabels', () => {
        it('deduplicates and sorts label arrays within targets', () => {
            const targets: CompetencyTarget[] = [
                { id: 't-1', labels: ['Z', 'A', 'Z', 'B'] }
            ];
            const normalized = normalizeTargetLabels(targets);
            expect(normalized[0].labels).toEqual(['A', 'B', 'Z']);
        });

        it('preserves all other target fields', () => {
            const targets: CompetencyTarget[] = [
                { id: 't-1', labels: ['B', 'A'], explanation: 'why' }
            ];
            const normalized = normalizeTargetLabels(targets);
            expect(normalized[0].id).toBe('t-1');
            expect(normalized[0].explanation).toBe('why');
        });

        it('does not mutate the input targets', () => {
            const targets: CompetencyTarget[] = [
                { id: 't-1', labels: ['Z', 'A'] }
            ];
            normalizeTargetLabels(targets);
            expect(targets[0].labels).toEqual(['Z', 'A']);
        });
    });

    describe('validateUniquePermutationsPerTarget', () => {
        it('returns no errors when permutations within a target definition are unique', () => {
            const targets: CompetencyTarget[] = [
                { id: 'prefix~a', labels: ['L1', 'L2'] },
                { id: 'prefix~b', labels: ['L1', 'L3'] }
            ];
            expect(validateUniquePermutationsPerTarget(targets)).toHaveLength(0);
        });

        it('returns an error when a target definition generates duplicate permutations', () => {
            const targets: CompetencyTarget[] = [
                { id: 'prefix~a', labels: ['L1', 'L2'] },
                { id: 'prefix~b', labels: ['L1', 'L2'] }
            ];
            const errors = validateUniquePermutationsPerTarget(targets);
            expect(errors).toHaveLength(1);
            expect(errors[0]).toContain('Target "prefix": duplicate permutations in "prefix~b" and "prefix~a"');
        });

        it('detects duplicates regardless of label order', () => {
            const targets: CompetencyTarget[] = [
                { id: 'prefix~a', labels: ['L2', 'L1'] },
                { id: 'prefix~b', labels: ['L1', 'L2'] }
            ];
            expect(validateUniquePermutationsPerTarget(targets)).toHaveLength(1);
        });

        it('reports every repeated permutation in a definition', () => {
            const targets: CompetencyTarget[] = [
                { id: 'prefix~a', labels: ['L1'] },
                { id: 'prefix~b', labels: ['L1'] },
                { id: 'prefix~c', labels: ['L1'] }
            ];
            expect(validateUniquePermutationsPerTarget(targets)).toHaveLength(2);
        });

        it('does not flag identical permutations across different target definitions', () => {
            const targets: CompetencyTarget[] = [
                { id: 'prefixA~a', labels: ['L1', 'L2'] },
                { id: 'prefixB~a', labels: ['L1', 'L2'] }
            ];
            expect(validateUniquePermutationsPerTarget(targets)).toHaveLength(0);
        });

        it('treats IDs without a ~ separator as their own definitions', () => {
            const targets: CompetencyTarget[] = [
                { id: 'alpha', labels: ['L1'] },
                { id: 'beta', labels: ['L1'] }
            ];
            expect(validateUniquePermutationsPerTarget(targets)).toHaveLength(0);
        });
    });

    describe('validateUniqueTargetPermutations', () => {
        it('returns no errors when definitions merely overlap in some permutations', () => {
            // Shared permutation L1|L2, but each definition also has a unique one
            const targets: CompetencyTarget[] = [
                { id: 'defA~a', labels: ['L1', 'L2'] },
                { id: 'defA~b', labels: ['L1', 'L3'] },
                { id: 'defB~a', labels: ['L1', 'L2'] },
                { id: 'defB~b', labels: ['L1', 'L4'] }
            ];
            expect(validateUniqueTargetPermutations(targets)).toHaveLength(0);
        });

        it('returns an error when two definitions define identical permutation sets', () => {
            const targets: CompetencyTarget[] = [
                { id: 'defA~a', labels: ['L1', 'L2'] },
                { id: 'defA~b', labels: ['L1', 'L3'] },
                { id: 'defB~a', labels: ['L1', 'L2'] },
                { id: 'defB~b', labels: ['L1', 'L3'] }
            ];
            const errors = validateUniqueTargetPermutations(targets);
            expect(errors).toHaveLength(1);
            expect(errors[0]).toContain('"defA" and "defB"');
            expect(errors[0]).toContain('identical permutation sets');
        });

        it('compares permutation sets regardless of permutation order within a definition', () => {
            const targets: CompetencyTarget[] = [
                { id: 'defA~a', labels: ['L1'] },
                { id: 'defA~b', labels: ['L2'] },
                { id: 'defB~a', labels: ['L2'] },
                { id: 'defB~b', labels: ['L1'] }
            ];
            expect(validateUniqueTargetPermutations(targets)).toHaveLength(1);
        });

        it('flags single-permutation definitions with the same label set', () => {
            const targets: CompetencyTarget[] = [
                { id: 'defA~a', labels: ['L1', 'L2'] },
                { id: 'defB~a', labels: ['L2', 'L1'] }
            ];
            expect(validateUniqueTargetPermutations(targets)).toHaveLength(1);
        });

        it('does not flag a definition whose permutation set is a strict subset of another', () => {
            const targets: CompetencyTarget[] = [
                { id: 'defA~a', labels: ['L1'] },
                { id: 'defB~a', labels: ['L1'] },
                { id: 'defB~b', labels: ['L2'] }
            ];
            expect(validateUniqueTargetPermutations(targets)).toHaveLength(0);
        });

        it('compares definitions as sets: internal duplicate permutations collapse', () => {
            const targets: CompetencyTarget[] = [
                { id: 'defA~a', labels: ['L1'] },
                { id: 'defA~b', labels: ['L1'] },
                { id: 'defB~a', labels: ['L1'] }
            ];
            // defA = {L1, L1} collapses to {L1} = defB
            expect(validateUniqueTargetPermutations(targets)).toHaveLength(1);
        });

        it('reports every additional definition sharing an already-seen permutation set', () => {
            const targets: CompetencyTarget[] = [
                { id: 'defA~a', labels: ['L1'] },
                { id: 'defB~a', labels: ['L1'] },
                { id: 'defC~a', labels: ['L1'] }
            ];
            expect(validateUniqueTargetPermutations(targets)).toHaveLength(2);
        });
    });

    describe('deduplicateTargetPermutations', () => {
        it('retains unique targets and issues no warnings when all label sets are unique', () => {
            const targets: CompetencyTarget[] = [
                { id: 't-1', labels: ['L1'] },
                { id: 't-2', labels: ['L2'] }
            ];
            const { deduplicatedTargets, warnings } = deduplicateTargetPermutations(targets);
            expect(deduplicatedTargets).toHaveLength(2);
            expect(warnings).toHaveLength(0);
        });

        it('deduplicates targets sharing identical label sets and generates descriptive warnings', () => {
            const targets: CompetencyTarget[] = [
                { id: 't-1', labels: ['L1', 'L2'] },
                { id: 't-2', labels: ['L1', 'L2'] },
                { id: 't-3', labels: ['L3'] }
            ];
            const { deduplicatedTargets, warnings } = deduplicateTargetPermutations(targets);
            expect(deduplicatedTargets).toHaveLength(2);
            expect(deduplicatedTargets.map(t => t.id)).toEqual(['t-1', 't-3']);
            expect(warnings).toHaveLength(1);
            expect(warnings[0]).toContain('[Cluster #1] 2 targets share labels (t-1, t-2) -> primary "t-1"');
        });

        it('numbers multiple clusters sequentially and keeps the first target of each', () => {
            const targets: CompetencyTarget[] = [
                { id: 'a-1', labels: ['L1'] },
                { id: 'a-2', labels: ['L1'] },
                { id: 'b-1', labels: ['L2'] },
                { id: 'b-2', labels: ['L2'] },
                { id: 'b-3', labels: ['L2'] }
            ];
            const { deduplicatedTargets, warnings } = deduplicateTargetPermutations(targets);
            expect(deduplicatedTargets.map(t => t.id)).toEqual(['a-1', 'b-1']);
            expect(warnings).toHaveLength(2);
            expect(warnings[0]).toContain('[Cluster #1] 2 targets');
            expect(warnings[1]).toContain('[Cluster #2] 3 targets');
        });

        it('does not merge distinct label sets containing delimiter-like characters', () => {
            const targets: CompetencyTarget[] = [
                { id: 't-1', labels: ['a|b'] },
                { id: 't-2', labels: ['a', 'b'] }
            ];
            const { deduplicatedTargets, warnings } = deduplicateTargetPermutations(targets);
            expect(deduplicatedTargets).toHaveLength(2);
            expect(warnings).toHaveLength(0);
        });
    });

    describe('normalizeAndValidateSpec (fixtures)', () => {
        const FIXTURE_ROOT = resolve(__dirname, '../../temp/test-spec-validator');

        afterEach(() => {
            if (existsSync(FIXTURE_ROOT)) rmSync(FIXTURE_ROOT, { recursive: true, force: true });
        });

        function writeFixture(moduleDir: string, fileName: string, contents: string) {
            const dir = resolve(FIXTURE_ROOT, moduleDir);
            mkdirSync(dir, { recursive: true });
            writeFileSync(resolve(dir, fileName), contents, 'utf-8');
        }

        it('normalizes labels, deduplicates overlap and computes stats for a valid module', async () => {
            writeFixture('valid', 'a.ts', `export const spec = [
                { id: 'defA~a', labels: ['Z', 'A', 'Z'] },
                { id: 'defA~b', labels: ['B'] },
                { id: 'defB~a', labels: ['A', 'Z'] },
                { id: 'defB~b', labels: ['C'] }
            ];`);
            const result = await normalizeAndValidateSpec('valid', FIXTURE_ROOT);
            expect(result.errors).toHaveLength(0);
            // defA~a ({A,Z} after normalization) and defB~a overlap -> deduplicated
            expect(result.stats).toEqual({ totalTargets: 4, uniqueTargets: 3, deduplicatedCount: 1 });
            expect(result.targets.map(t => t.id)).toEqual(['defA~a', 'defA~b', 'defB~b']);
            expect(result.targets[0].labels).toEqual(['A', 'Z']);
            expect(result.warnings).toHaveLength(1);
            expect(result.warnings[0]).toContain('defA~a, defB~a');
        });

        it('reports duplicate target IDs as validation errors (gatekeeper moved out of loadTargets)', async () => {
            writeFixture('dup-ids', 'a.ts', `export const spec = [{ id: 'dup~a', labels: ['A'] }];`);
            writeFixture('dup-ids', 'b.ts', `export const spec = [{ id: 'dup~a', labels: ['B'] }];`);
            const result = await normalizeAndValidateSpec('dup-ids', FIXTURE_ROOT);
            expect(result.errors).toHaveLength(1);
            expect(result.errors[0]).toContain('Duplicate target ID "dup~a"');
        });

        it('reports duplicate permutations within a definition as errors', async () => {
            writeFixture('intra-dup', 'a.ts', `export const spec = [
                { id: 'def~a', labels: ['B', 'A'] },
                { id: 'def~b', labels: ['A', 'B', 'A'] }
            ];`);
            const result = await normalizeAndValidateSpec('intra-dup', FIXTURE_ROOT);
            expect(result.errors).toHaveLength(1);
            expect(result.errors[0]).toContain('Target "def": duplicate permutations');
        });

        it('reports definitions with identical permutation sets as errors', async () => {
            writeFixture('identical-defs', 'a.ts', `export const spec = [
                { id: 'defA~a', labels: ['A'] },
                { id: 'defA~b', labels: ['B'] },
                { id: 'defB~a', labels: ['B'] },
                { id: 'defB~b', labels: ['A'] }
            ];`);
            const result = await normalizeAndValidateSpec('identical-defs', FIXTURE_ROOT);
            expect(result.errors).toHaveLength(1);
            expect(result.errors[0]).toContain('identical permutation sets');
        });

        it('rejects when the spec module does not exist', async () => {
            await expect(normalizeAndValidateSpec('does-not-exist', FIXTURE_ROOT))
                .rejects.toThrow(/Spec module not found/);
        });
    });

    describe('normalizeAndValidateSpec (live test spec)', () => {
        it('validates and deduplicates the committed test spec module', async () => {
            const result = await normalizeAndValidateSpec('test');
            expect(result.errors).toHaveLength(0);
            expect(result.stats.totalTargets).toBe(101);
            expect(result.stats.uniqueTargets).toBe(99);
            expect(result.stats.deduplicatedCount).toBe(2);
            expect(result.warnings).toHaveLength(2);
            expect(result.targets).toHaveLength(99);

            const ids = result.targets.map(t => t.id);
            expect(new Set(ids).size).toBe(ids.length);
            for (const target of result.targets) {
                const normalized = Array.from(new Set(target.labels)).sort();
                expect(target.labels).toEqual(normalized);
            }
        });
    });
});
