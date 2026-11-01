import {describe, expect, it, vi} from 'vitest';
import {createCanonicalNumericRange, hasCanonicalRangeWitness} from '../../../lib/canonical-numeric-range.ts';
import * as randomSource from '../../../lib/random.ts';
import {setSeed} from '../../../lib/random.ts';
import {EqualGroupsCollectionGenerator} from './generator.ts';
import {equalGroupsRangeProfiles} from './range-profile.ts';

describe('EqualGroupsCollectionGenerator', () => {
    const generator = new EqualGroupsCollectionGenerator();

    it('validates its required configuration', () => {
        expect(() => generator.generate({} as never)).toThrow();
    });

    it.each([
        ['multiplication', 'total'],
        ['partitive-division', 'groupSize'],
        ['quotative-division', 'groupCount']
    ] as const)('generates valid %s collections', (operation, answerField) => {
        for (let seed = 0; seed < 40; seed++) {
            setSeed(seed);
            const data = generator.generate({operation, range: createCanonicalNumericRange(20)}).data;
            expect(data.groupCount).toBeGreaterThanOrEqual(2);
            expect(data.groupCount).toBeLessThanOrEqual(6);
            expect(data.groupSize).toBeGreaterThanOrEqual(2);
            expect(data.groupSize).toBeLessThanOrEqual(6);
            expect(data.total).toBe(data.groupCount * data.groupSize);
            expect(data.total).toBeLessThan(100);
            expect(data.answer).toBe(data[answerField]);
        }
    });

    it.each(['multiplication', 'partitive-division', 'quotative-division'] as const)(
        'preserves all 25 ordered collections and the answer role for %s', operation => {
            const seen = new Set<string>();
            const random = vi.spyOn(randomSource, 'random');
            try {
                for (const {range} of equalGroupsRangeProfiles) {
                    const expected = [];
                    for (let count = 2; count <= 6; count++) for (let size = 2; size <= 6; size++) {
                        const upper = [5, 10, 20, 100].find(bound => count * size <= bound);
                        const lower = Math.min(count, size) >= 5 ? 5 : 0;
                        if (range.min === lower && range.max === upper) expected.push(`${count},${size}`);
                    }
                    const profileSeen = new Set<string>();
                    for (let index = 0; index < expected.length; index++) {
                        random.mockReturnValue((index + 0.5) / expected.length);
                        const {data} = generator.generate({operation, range});
                        const key = `${data.groupCount},${data.groupSize}`;
                        expect(seen.has(key)).toBe(false);
                        seen.add(key);
                        profileSeen.add(key);
                        expect(data.total).toBe(data.groupCount * data.groupSize);
                        expect(data.answer).toBe(operation === 'partitive-division' ? data.groupSize
                            : operation === 'quotative-division' ? data.groupCount : data.total);
                        expect(hasCanonicalRangeWitness([data.groupCount, data.groupSize, data.total, data.answer], range)).toBe(true);
                        expect(Object.keys(data).sort()).toEqual(['answer', 'groupCount', 'groupSize', 'operation', 'total']);
                    }
                    expect(profileSeen).toEqual(new Set(expected));
                }
            } finally {
                random.mockRestore();
            }
            expect(seen.size).toBe(25);
            expect(seen).toContain('6,2');
            expect(seen).toContain('2,6');
            expect(seen).toContain('6,6');
        }
    );

    it.each([
        {operation: 'other', range: createCanonicalNumericRange(5)},
        {operation: 'multiplication'},
        {operation: 'multiplication', range: {min: 2, max: 8}},
        {operation: 'multiplication', range: {...createCanonicalNumericRange(20), maximumAbove: 0}},
        {operation: 'multiplication', range: createCanonicalNumericRange(100, 10)},
        {operation: 'multiplication', range: createCanonicalNumericRange(1000)}
    ])('rejects an invalid or empty configuration before sampling: %j', config => {
        const random = vi.spyOn(randomSource, 'random');
        try {
            expect(() => generator.generate(config as never)).toThrow();
            expect(random).not.toHaveBeenCalled();
        } finally {
            random.mockRestore();
        }
    });
});
