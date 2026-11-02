import {describe, expect, it} from 'vitest';
import {canonicalRangeProfiles} from '../../../lib/canonical-range-labels.ts';
import {CANONICAL_RANGE_THRESHOLDS, createCanonicalNumericRange, hasCanonicalRangeWitness} from '../../../lib/canonical-numeric-range.ts';
import {canonicalEstimationCases, canonicalEstimationDomain, estimationConstructionContexts, estimationQuantities,
    hasCanonicalEstimationProfile, sampleCanonicalEstimation} from './canonical-domain.ts';
import {estimationRawRows, estimationRelation} from './numeric-domain.ts';
import {estimationProposalCases, proposalSeedCount} from './proposal-domain.ts';

const operations = ['addition', 'subtraction', 'multiplication', 'division'] as const;
const cellKey = (operation: string, zero: boolean, min: number, max: number) => `${operation}:${zero}:${min}:${max}`;
const profiles = canonicalRangeProfiles.filter(({range}) => range.max <= 1000);

describe('canonical estimation construction-context union', () => {
    it('preserves every original declared-context pair/proposal path and its exact conditional probability', () => {
        const expected = new Map<string, number>();
        let contexts = 0, pairPaths = 0, proposalPaths = 0;
        for (const operation of operations) for (const maximum of [5, 10, 20, 100, 120, 1000]) {
            for (const minimum of [0, 5, 10, 20, 100, 120].filter(minimum => minimum < maximum)) {
                contexts++;
                const source = {operation, minimum, maximum};
                for (const row of estimationRawRows(source)) for (let second = row.secondMin; second <= row.secondMax; second++) {
                    const data = estimationRelation(source, row.first, second);
                    if (!data) continue;
                    const proposals = estimationProposalCases(data);
                    if (!proposals.length) continue;
                    pairPaths++;
                    const values = estimationQuantities(data), baseMin = Math.min(...values), baseMax = Math.max(...values);
                    for (const proposal of proposals) {
                        proposalPaths++;
                        const min = Math.min(baseMin, proposal.proposedAnswer, proposal.roundedProposedAnswer);
                        const max = Math.max(baseMax, proposal.proposedAnswer, proposal.roundedProposedAnswer);
                        const upper = CANONICAL_RANGE_THRESHOLDS.find(bound => max <= bound)!;
                        const lower = [120, 100, 20, 10, 5, 0].find(bound => min >= bound)!;
                        if (minimum > lower || maximum < upper) throw new Error('A contributing old context was excluded');
                        const key = cellKey(operation, min === 0, lower, upper);
                        expected.set(key, (expected.get(key) ?? 0) + row.pairWeight * proposal.seeds / proposalSeedCount);
                    }
                }
            }
        }
        let cells = 0;
        for (const operation of operations) for (const zero of [false, true]) for (const {range} of profiles) {
            const domain = canonicalEstimationDomain(operation, zero, range);
            const mass = expected.get(cellKey(operation, zero, range.min, range.max)) ?? 0;
            expect(domain.weight).toBeCloseTo(mass, 9);
            expect(hasCanonicalEstimationProfile(operation, zero, range)).toBe(mass > 0);
            if (domain.weight) cells++;
            const seen = new Set<string>();
            for (const row of domain.rows) {
                const key = `${row.source.minimum}:${row.source.maximum}:${row.first}`;
                if (seen.has(key) || new Set(row.seconds).size !== row.seconds.length) throw new Error('Duplicated an old construction path');
                seen.add(key);
                for (const second of [row.seconds[0]!, row.seconds.at(-1)!]) {
                    const data = estimationRelation(row.source, row.first, second)!;
                    const cases = canonicalEstimationCases(data, zero, range);
                    for (const proposal of [cases[0]!, cases.at(-1)!]) {
                        if (!hasCanonicalRangeWitness(estimationQuantities({...data, proposal}), range)) throw new Error('False canonical claim');
                    }
                }
            }
        }
        expect(contexts).toBe(84);
        expect(cells).toBe(47);
        expect(expected.size).toBe(47);
        expect(pairPaths).toBeGreaterThan(1000000);
        expect(proposalPaths).toBeGreaterThan(10000000);
    }, 60000);

    it('retains legitimate proposals that disappear if construction floors are substituted or widened', () => {
        const small = estimationRelation({operation: 'subtraction', minimum: 0, maximum: 20}, 9, 10)!;
        expect(canonicalEstimationCases(small, false, createCanonicalNumericRange(20, 5))
            .some(proposal => proposal.proposedAnswer === 15)).toBe(true);
        const positive = estimationRelation({operation: 'subtraction', minimum: 120, maximum: 1000}, 121, 120)!;
        expect(canonicalEstimationCases(positive, false, createCanonicalNumericRange(1000, 120))
            .some(proposal => proposal.proposedAnswer === 122)).toBe(true);
        expect(estimationConstructionContexts('subtraction', createCanonicalNumericRange(1000, 120)))
            .toContainEqual({operation: 'subtraction', minimum: 120, maximum: 1000});
    });

    it('rejects invalid canonical contracts and returns known-empty cells directly', () => {
        expect(() => canonicalEstimationDomain('addition', true, {min: 0, max: 1000} as never)).toThrow();
        expect(() => canonicalEstimationDomain('addition', true, {...createCanonicalNumericRange(1000), maximumAbove: 10})).toThrow();
        expect(() => canonicalEstimationDomain('unsupported' as never, true, createCanonicalNumericRange(1000))).toThrow();
        expect(sampleCanonicalEstimation('multiplication', false, createCanonicalNumericRange(120))).toBeNull();
        expect(hasCanonicalEstimationProfile('division', false, createCanonicalNumericRange(1000, 100))).toBe(false);
        expect(hasCanonicalEstimationProfile('addition', true, createCanonicalNumericRange(1000, 5))).toBe(false);
    });
});
