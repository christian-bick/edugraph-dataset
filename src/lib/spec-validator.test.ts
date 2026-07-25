import { describe, it, expect } from 'vitest';
import {
    validateUniqueTargetIds,
    normalizeTargetLabels,
    validateUniquePermutationsPerTarget,
    validateUniqueTargetPermutations,
    deduplicateTargetPermutations,
    normalizeAndValidateSpec
} from './spec-validator.ts';
import { CompetencyTarget } from '../types/ml-engine.ts';

describe('spec-validator', () => {
    describe('validateUniqueTargetIds', () => {
        it('returns no errors when all target IDs are unique', () => {
            const targets: CompetencyTarget[] = [
                { id: 't-1', labels: ['L1'] },
                { id: 't-2', labels: ['L2'] }
            ];
            const errors = validateUniqueTargetIds(targets);
            expect(errors).toHaveLength(0);
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
    });

    describe('normalizeTargetLabels', () => {
        it('deduplicates and sorts label arrays within targets', () => {
            const targets: CompetencyTarget[] = [
                { id: 't-1', labels: ['Z', 'A', 'Z', 'B'] }
            ];
            const normalized = normalizeTargetLabels(targets);
            expect(normalized[0].labels).toEqual(['A', 'B', 'Z']);
        });
    });

    describe('validateUniquePermutationsPerTarget', () => {
        it('returns no errors when permutations within a target definition prefix are unique', () => {
            const targets: CompetencyTarget[] = [
                { id: 'prefix-0', labels: ['L1', 'L2'] },
                { id: 'prefix-1', labels: ['L1', 'L3'] }
            ];
            const errors = validateUniquePermutationsPerTarget(targets);
            expect(errors).toHaveLength(0);
        });

        it('returns an error when a target definition prefix generates duplicate permutations', () => {
            const targets: CompetencyTarget[] = [
                { id: 'prefix-0', labels: ['L1', 'L2'] },
                { id: 'prefix-1', labels: ['L1', 'L2'] }
            ];
            const errors = validateUniquePermutationsPerTarget(targets);
            expect(errors).toHaveLength(1);
            expect(errors[0]).toContain('Target "prefix": duplicate permutations in "prefix-1" and "prefix-0"');
        });

        it('does not flag identical permutations across different target prefixes', () => {
            const targets: CompetencyTarget[] = [
                { id: 'prefixA-0', labels: ['L1', 'L2'] },
                { id: 'prefixB-0', labels: ['L1', 'L2'] }
            ];
            const errors = validateUniquePermutationsPerTarget(targets);
            expect(errors).toHaveLength(0);
        });
    });

    describe('validateUniqueTargetPermutations', () => {
        it('returns no errors when all targets across the spec have distinct label sets', () => {
            const targets: CompetencyTarget[] = [
                { id: 't-1', labels: ['L1'] },
                { id: 't-2', labels: ['L2'] }
            ];
            const errors = validateUniqueTargetPermutations(targets);
            expect(errors).toHaveLength(0);
        });

        it('returns an error when any two targets across the spec share the exact same normalized label set', () => {
            const targets: CompetencyTarget[] = [
                { id: 't-1', labels: ['L1', 'L2'] },
                { id: 't-2', labels: ['L1', 'L2'] }
            ];
            const errors = validateUniqueTargetPermutations(targets);
            expect(errors).toHaveLength(1);
            expect(errors[0]).toContain('Duplicate permutation: "t-2" matches "t-1"');
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
    });

    describe('normalizeAndValidateSpec', () => {
        it('normalizes, validates, and deduplicates targets from a spec module', async () => {
            const result = await normalizeAndValidateSpec('test');
            expect(result.errors).toHaveLength(0);
            expect(result.stats.totalTargets).toBe(101);
            expect(result.stats.uniqueTargets).toBe(99);
            expect(result.stats.deduplicatedCount).toBe(2);
            expect(result.warnings).toHaveLength(2);
            expect(result.targets).toHaveLength(99);
        });
    });
});
