import {divisionFixtureRange} from './range-fixtures.ts';
import {createCanonicalNumericRange} from '../../../lib/canonical-numeric-range.ts';
import {commonDivisionMaximum, divisionRangeRows, hasSharedDivisionRange} from './numeric-domain.ts';
import {afterEach, describe, expect, it, vi} from 'vitest';
import * as rng from '../../../lib/random.ts';
import {FractionDivisionRelationsGenerator} from './generator.ts';
import {divisionOperandDistribution, type DivisionGroupCountProfile, type DivisionOperandProfile} from './operand-profiles.ts';

afterEach(() => vi.restoreAllMocks());
const denominators = [2, 3, 4, 6];
const roles = ['fraction-by-fraction', 'fraction-by-integer', 'integer-by-fraction'] as const;
const denominatorWeights = (proper: boolean, dividend: boolean) => denominators.map(denominator => {
    const total = 4 * denominator + (dividend ? 1 : 0);
    const count = proper ? denominator - (dividend ? 0 : 1) : 3 * denominator + 1;
    return count / total;
});
const key = (a: number, b: number, c: number, d: number) => `${a}/${b}:${c}/${d}`;

describe.each(roles)('complete finite division support for %s', role => {
    it('partitions every original expressed pair once and preserves the old law conditional on magnitude and group count', () => {
        const classifyDividend = role !== 'integer-by-fraction';
        const firstDenominators = classifyDividend ? denominators : [1];
        const secondDenominators = role === 'fraction-by-integer' ? [1] : denominators;
        const oracle: {profile: DivisionOperandProfile; group: DivisionGroupCountProfile; a: number; b: number; c: number; d: number;
            originalWeight: number; magnitudeProbability: number}[] = [];
        const groupMass = new Map<string, number>();
        const profileCounts = [0, 0];
        let oldMass = 0;
        // Independent oracle: the old sampler picked denominators uniformly and
        // expressed numerators uniformly, then conditioned on the chosen magnitude.
        for (const b of firstDenominators) for (const d of secondDenominators) {
            for (let a = 0; a <= 4 * b; a++) for (let c = 1; c <= 4 * d; c++) {
                const proper = classifyDividend ? a < b : c < d;
                const profile = `${role}-${proper ? 'proper' : 'improper'}` as const;
                const group = a * d < c * b ? 'zero' : 'positive';
                const firstMin = classifyDividend && !proper ? b : 0;
                const firstMax = classifyDividend && proper ? b - 1 : 4 * b;
                const secondMin = !classifyDividend && !proper ? d : 1;
                const secondMax = !classifyDividend && proper ? d - 1 : 4 * d;
                const weights = denominatorWeights(proper, classifyDividend);
                const index = denominators.indexOf(classifyDividend ? b : d);
                const denominatorProbability = weights[index]! / weights.reduce((sum, weight) => sum + weight, 0);
                const magnitudeProbability = denominatorProbability
                    / (classifyDividend ? secondDenominators.length : firstDenominators.length)
                    / (firstMax - firstMin + 1) / (secondMax - secondMin + 1);
                const originalWeight = 1 / firstDenominators.length / secondDenominators.length / (4 * b + 1) / (4 * d);
                oracle.push({profile, group, a, b, c, d, originalWeight, magnitudeProbability});
                const groupKey = `${profile}/${group}`;
                groupMass.set(groupKey, (groupMass.get(groupKey) ?? 0) + magnitudeProbability);
                profileCounts[proper ? 0 : 1] = profileCounts[proper ? 0 : 1]! + 1;
                oldMass += originalWeight;
            }
        }
        const intervals = new Map<string, Map<string, {draw: number; probability: number; weight: number}>>();
        let legalProfiles = 0;
        for (const proper of [true, false]) for (const group of ['zero', 'positive'] as const) {
            const profile = `${role}-${proper ? 'proper' : 'improper'}` as const;
            const candidates = divisionOperandDistribution(profile, group);
            if (!candidates.length) {
                expect(profile).toBe('fraction-by-integer-proper');
                expect(group).toBe('positive');
                continue;
            }
            legalProfiles++;
            const total = candidates.reduce((sum, candidate) => sum + candidate.weight, 0);
            let before = 0;
            const pairs = new Map<string, {draw: number; probability: number; weight: number}>();
            for (const candidate of candidates) {
                const pair = key(candidate.dividend.numerator, candidate.dividend.denominator,
                    candidate.divisor.numerator, candidate.divisor.denominator);
                expect(pairs.has(pair)).toBe(false);
                pairs.set(pair, {draw: (before + candidate.weight / 2) / total,
                    probability: candidate.weight / total, weight: candidate.weight});
                before += candidate.weight;
            }
            intervals.set(`${profile}/${group}`, pairs);
        }
        const random = vi.spyOn(rng, 'random');
        const generator = new FractionDivisionRelationsGenerator();
        const seen = new Set<string>();
        let zeroDividends = 0, positiveSubunitQuotients = 0, positiveExactQuotients = 0;
        for (const expected of oracle) {
            const groupKey = `${expected.profile}/${expected.group}`;
            const pair = key(expected.a, expected.b, expected.c, expected.d);
            const interval = intervals.get(groupKey)!.get(pair)!;
            expect(interval).toBeDefined();
            expect(interval.weight).toBeCloseTo(expected.originalWeight, 16);
            expect(interval.probability).toBeCloseTo(expected.magnitudeProbability / groupMass.get(groupKey)!, 14);
            const range = hasSharedDivisionRange(expected.profile, expected.group)
                ? createCanonicalNumericRange([5, 10, 20, 100].find(upper => commonDivisionMaximum(
                    {numerator: expected.a, denominator: expected.b}, {numerator: expected.c, denominator: expected.d}) <= upper)!)
                : divisionFixtureRange(expected.profile, expected.group);
            let draw = interval.draw;
            if (hasSharedDivisionRange(expected.profile, expected.group)) {
                const candidates = divisionRangeRows(expected.profile, expected.group, range);
                const index = candidates.findIndex(row => row.dividend.numerator === expected.a && row.dividend.denominator === expected.b
                    && row.divisor.numerator === expected.c && row.divisor.denominator === expected.d);
                expect(index).toBeGreaterThanOrEqual(0);
                draw = (candidates.slice(0, index).reduce((sum, row) => sum + row.weight, 0) + candidates[index]!.weight / 2)
                    / candidates.reduce((sum, row) => sum + row.weight, 0);
            }
            random.mockReset().mockReturnValueOnce(draw).mockReturnValueOnce(0);
            const data = generator.generate({range, operandProfile: expected.profile, groupCountProfile: expected.group,
                withEquation: false, withMultiplication: false}).data;
            expect(data.dividend).toEqual({numerator: expected.a, denominator: expected.b});
            expect(data.divisor).toEqual({numerator: expected.c, denominator: expected.d});
            expect(data.model.completeGroups === 0).toBe(expected.group === 'zero');
            expect(random).toHaveBeenCalledTimes(2);
            expect(seen.has(pair)).toBe(false);
            seen.add(pair);
            if (expected.a === 0) zeroDividends++;
            if (expected.a > 0 && expected.group === 'zero') positiveSubunitQuotients++;
            if (data.model.remainderTicks === 0 && data.model.completeGroups > 0) positiveExactQuotients++;
        }
        expect(oldMass).toBeCloseTo(1, 12);
        expect(oracle).toHaveLength(role === 'fraction-by-fraction' ? 3840 : role === 'fraction-by-integer' ? 256 : 300);
        expect([...intervals.values()].reduce((sum, pairs) => sum + pairs.size, 0)).toBe(oracle.length);
        expect(profileCounts).toEqual(role === 'fraction-by-fraction' ? [900, 2940]
            : role === 'fraction-by-integer' ? [60, 196] : [55, 245]);
        expect(zeroDividends).toBe(role === 'fraction-by-fraction' ? 240 : role === 'fraction-by-integer' ? 16 : 60);
        expect(legalProfiles).toBe(role === 'fraction-by-integer' ? 3 : 4);
        expect(positiveSubunitQuotients).toBeGreaterThan(0);
        expect(positiveExactQuotients).toBeGreaterThan(0);
    });
});
