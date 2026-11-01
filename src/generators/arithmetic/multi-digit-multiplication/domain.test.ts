import {describe, expect, it} from 'vitest';
import {canonicalRangeProfiles} from '../../../lib/canonical-range-labels.ts';
import {createCanonicalNumericRange, hasCanonicalRangeWitness} from '../../../lib/canonical-numeric-range.ts';
import {multiplicationDomain, profileDigits} from './domain.ts';
import type {OperandDigitProfile} from './spec.ts';

const parts = (value: number) => [...String(value)].map((digit, index, digits) => Number(digit) * 10 ** (digits.length - index - 1));
const quantities = (first: number, second: number) => [first, second, first * second, ...parts(first), ...parts(second),
    ...parts(first).flatMap(a => parts(second).map(b => a * b))];
const supportedRanges = canonicalRangeProfiles.filter(({range}) => range.max <= 100000 && [0, 5].includes(range.min));

describe('finite partial-product multiplication domains', () => {
    it('retains every original nonzero-digit draw path with the original duplicate sorted-pair weights', () => {
        let totalPaths = 0, distinctFrames = 0;
        for (const [profile, digits] of Object.entries(profileDigits) as [OperandDigitProfile, typeof profileDigits[OperandDigitProfile]][]) {
            const expected = new Map<string, number>();
            for (let first = 10 ** (digits.smallest - 1); first < 10 ** digits.smallest; first++) {
                if (String(first).includes('0')) continue;
                for (let second = 10 ** (digits.largest - 1); second < 10 ** digits.largest; second++) {
                    if (String(second).includes('0')) continue;
                    const key = `${Math.min(first, second)}:${Math.max(first, second)}`;
                    expected.set(key, (expected.get(key) ?? 0) + 1);
                }
            }
            const actual = new Map<string, number>();
            for (const {range} of supportedRanges) {
                let allValid = true;
                for (const [first, second] of multiplicationDomain(profile, range)) {
                    allValid &&= hasCanonicalRangeWitness(quantities(first, second), range);
                    const key = `${first}:${second}`;
                    actual.set(key, (actual.get(key) ?? 0) + 1);
                    totalPaths++;
                }
                expect(allValid).toBe(true);
            }
            expect(actual).toEqual(expected);
            distinctFrames += actual.size;
        }
        expect(totalPaths).toBe(72981);
        expect(distinctFrames).toBe(69705);
    });

    it('includes the required ones-place magnitude in the lower bound, but not a coefficient from a place caption', () => {
        const domain = multiplicationDomain('one-by-two', createCanonicalNumericRange(1000, 5));
        expect(domain).toContainEqual([5, 95]); // 9 tens represents 90; the actual minimum part is 5.
        expect(domain).not.toContainEqual([5, 91]); // The independently added ones component is 1.
        expect(multiplicationDomain('two-by-two', createCanonicalNumericRange(120))).toEqual([]);
        expect(() => multiplicationDomain('one-by-one', {...createCanonicalNumericRange(100), minimumBelow: 0})).toThrow('witnesses');
        expect(() => multiplicationDomain('one-by-four', createCanonicalNumericRange(1000000))).toThrow('reviewed');
    });
});
