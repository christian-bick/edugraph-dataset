import {describe, expect, it} from 'vitest';
import {canonicalRangeProfiles} from '../../../lib/canonical-range-labels.ts';
import {createCanonicalNumericRange, hasCanonicalRangeWitness} from '../../../lib/canonical-numeric-range.ts';
import {patternDomain, patternQuantities} from './domain.ts';

describe('finite arithmetic recurrence domains', () => {
    it('partitions all original rule/start/witness draws once without changing their conditional uniform law', () => {
        const counts: number[] = [];
        let cells = 0;
        for (const operation of ['addition', 'multiplication'] as const) {
            for (const property of [false, 'commutative', 'associative', 'distributive'] as const) {
                const candidates = canonicalRangeProfiles.filter(({range}) => range.max <= 10000 && [0, 5].includes(range.min))
                    .flatMap(({range}) => {
                        const domain = patternDomain(operation, property, range);
                        if (domain.length) cells++;
                        expect(domain.every(data => hasCanonicalRangeWitness(patternQuantities(data), range))).toBe(true);
                        return domain;
                    });
                const expected = property === 'distributive' ? operation === 'multiplication' ? 25 : 0
                    : property === 'associative' ? 4 : property === 'commutative' ? 6 : operation === 'addition' ? 30 : 6;
                expect(candidates.length).toBe(expected);
                expect(new Set(candidates.map(data => JSON.stringify(data))).size).toBe(expected);
                for (const data of candidates) {
                    const recurrence = data.recurrence;
                    if (recurrence.kind === 'position-multiple') {
                        expect(data.terms).toEqual([0, 1, 2, 3, 4, 5, 6].map(index => index * recurrence.factor));
                    } else {
                        expect(data.terms).toEqual(Array.from({length: property || operation === 'multiplication' ? 5 : 6}, (_, index) =>
                            operation === 'addition' ? recurrence.start + index * recurrence.operand : recurrence.start * recurrence.operand ** index));
                    }
                    const min = Math.min(...patternQuantities(data));
                    if (min >= 5) expect(recurrence).toMatchObject({kind: 'add-constant', operand: 5});
                }
                counts.push(candidates.length);
            }
        }
        expect(counts).toEqual([30, 6, 4, 0, 6, 6, 4, 25]);
        expect(cells).toBe(20);
    });

    it('retains the large multiplicative boundary and the strongest positive floor', () => {
        expect(patternDomain('multiplication', false, createCanonicalNumericRange(10000)))
            .toMatchObject([{terms: [5, 20, 80, 320, 1280]}]);
        expect(patternDomain('addition', false, createCanonicalNumericRange(100, 5))).toHaveLength(6);
        expect(patternDomain('multiplication', 'distributive', createCanonicalNumericRange(20, 5))).toEqual([]);
        expect(() => patternDomain('addition', false, {...createCanonicalNumericRange(20), maximumAbove: 0})).toThrow('witnesses');
        expect(() => patternDomain('addition', false, createCanonicalNumericRange(100000))).toThrow('reviewed');
    });
});
