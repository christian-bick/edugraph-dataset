import {describe, expect, it, vi} from 'vitest';
import {createCanonicalNumericRange} from '../../lib/canonical-numeric-range.ts';
import {getRandomState, random, setSeed} from '../../lib/random.ts';
import {basicCountingCounts, basicCountingProfiles, buildCountingEnumeration, buildCountingTotal,
    sampleBasicCountingQuantity, type BasicCountingContract} from './basic-counting-domain.ts';

const cases = [
    {contract: 'enumeration', upper: 5, lower: 0, first: 1, last: 5},
    {contract: 'enumeration', upper: 10, lower: 0, first: 6, last: 10},
    {contract: 'enumeration', upper: 20, lower: 0, first: 11, last: 20},
    {contract: 'total', upper: 5, lower: 0, first: 1, last: 4},
    {contract: 'total', upper: 10, lower: 5, first: 6, last: 9},
    {contract: 'total', upper: 20, lower: 10, first: 11, last: 19}
] as const;
const parities = ['any', 'even', 'odd'] as const;
const nativeCounts = (contract: BasicCountingContract) => Array.from({length: 20}, (_, index) => index + 1)
    .filter(count => contract === 'enumeration' || ![5, 10, 20].includes(count));

describe('basic counting mathematical domains', () => {
    it.each(cases)('retains the exact uniform conditional count law for $contract/$lower..$upper', ({contract, upper, lower, first, last}) => {
        const range = createCanonicalNumericRange(upper, lower);
        for (const parity of parities) {
            const expected = Array.from({length: last - first + 1}, (_, index) => first + index)
                .filter(count => parity === 'any' || count % 2 === (parity === 'even' ? 0 : 1));
            const counts = basicCountingCounts(contract, range, parity);
            expect(counts).toEqual(expected);
            expect(basicCountingCounts(contract, {...range}, parity)).toBe(counts);
            for (let index = 0; index < expected.length; index++) {
                const draw = vi.fn(() => (index + 0.5) / expected.length);
                const quantity = sampleBasicCountingQuantity(contract, range, parity, draw);
                expect(quantity).toEqual({numObjects: expected[index], simpleAnswer: expected[index],
                    ...(parity === 'any' ? {} : {parity})});
                expect(draw).toHaveBeenCalledTimes(1);
            }
            expect(sampleBasicCountingQuantity(contract, range, parity, () => 0).numObjects).toBe(expected[0]);
            expect(sampleBasicCountingQuantity(contract, range, parity, () => 1 - Number.EPSILON).numObjects).toBe(expected.at(-1));
        }
    });

    it.each(['enumeration', 'total'] as const)('partitions all native $contract outcomes with no extra retirement', contract => {
        const profiles = basicCountingProfiles(contract);
        expect(profiles.map(({range}) => [range.min, range.max])).toEqual(contract === 'enumeration'
            ? [[0, 5], [0, 10], [0, 20]] : [[0, 5], [5, 10], [10, 20]]);
        for (const parity of parities) {
            const counts = profiles.flatMap(({range}) => basicCountingCounts(contract, range, parity));
            const expected = nativeCounts(contract).filter(count => parity === 'any' || count % 2 === (parity === 'even' ? 0 : 1));
            expect(counts).toEqual(expected);
            expect(new Set(counts).size).toBe(counts.length);
        }
        expect(profiles.reduce((sum, {range}) => sum + parities.reduce((total, parity) =>
            total + basicCountingCounts(contract, range, parity).length, 0), 0)).toBe(contract === 'enumeration' ? 40 : 34);
    });

    it.each(cases)('preserves one-call PRNG continuation for $contract/$lower..$upper', ({contract, upper, lower}) => {
        const range = createCanonicalNumericRange(upper, lower);
        for (const parity of parities) {
            setSeed(`${contract}:${upper}:${parity}`);
            const value = random(), continuation = getRandomState();
            const expected = sampleBasicCountingQuantity(contract, range, parity, () => value);
            setSeed(`${contract}:${upper}:${parity}`);
            expect(sampleBasicCountingQuantity(contract, range, parity, random)).toEqual(expected);
            expect(getRandomState()).toBe(continuation);
        }
    });

    it('keeps scalar quantities separate from fresh enumeration evidence', () => {
        const scalar = {numObjects: 6, simpleAnswer: 6, parity: 'even' as const};
        const enumerated = buildCountingEnumeration(scalar), total = buildCountingTotal(scalar);
        expect(enumerated).toEqual({kind: 'counting-enumeration', ...scalar, countingNumbers: [1, 2, 3, 4, 5, 6]});
        expect(total).toEqual({kind: 'counting-total', ...scalar});
        expect(total).not.toHaveProperty('countingNumbers');
        expect(buildCountingEnumeration(scalar).countingNumbers).not.toBe(enumerated.countingNumbers);
        expect(buildCountingTotal(scalar)).not.toBe(total);
        expect(scalar).toEqual({numObjects: 6, simpleAnswer: 6, parity: 'even'});
    });

    it('projects only scalar fields when rebuilding a structurally compatible richer payload', () => {
        const scalar = {numObjects: 6, simpleAnswer: 6, parity: 'even' as const};
        const enumeration = buildCountingEnumeration(scalar), total = buildCountingTotal(scalar);
        expect(buildCountingTotal(enumeration)).toEqual(total);
        expect(buildCountingTotal(enumeration)).not.toHaveProperty('countingNumbers');
        const rebuiltEnumeration = buildCountingEnumeration(total);
        expect(rebuiltEnumeration).toEqual(enumeration);
        expect(rebuiltEnumeration.countingNumbers).not.toBe(enumeration.countingNumbers);
        const richer = {...enumeration, countingNumbers: [99], availableCount: 20};
        const projectedEnumeration = buildCountingEnumeration(richer), projectedTotal = buildCountingTotal(richer);
        expect(projectedEnumeration).toEqual(enumeration);
        expect(projectedEnumeration.countingNumbers).not.toBe(richer.countingNumbers);
        expect(projectedEnumeration).not.toHaveProperty('availableCount');
        expect(projectedTotal).toEqual(total);
        expect(projectedTotal).not.toHaveProperty('availableCount');
        expect(richer.countingNumbers).toEqual([99]);
    });

    it.each(['enumeration', 'total'] as const)('validates the full $contract profile and parity before drawing', contract => {
        const range = basicCountingProfiles(contract)[0]!.range, draw = vi.fn(() => 0);
        for (const invalid of [undefined, false, {min: range.min, max: range.max},
            {...range, maximumAbove: 0}, {...range, minimumBelow: 10}, createCanonicalNumericRange(100)]) {
            expect(() => sampleBasicCountingQuantity(contract, invalid as never, 'any', draw)).toThrow();
        }
        expect(() => sampleBasicCountingQuantity(contract, range, 'prime' as never, draw)).toThrow();
        expect(draw).not.toHaveBeenCalled();
    });
});
