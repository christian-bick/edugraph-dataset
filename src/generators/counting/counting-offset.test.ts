import {describe, expect, it} from 'vitest';
import {getRandomState, random, setSeed} from '../../lib/random.ts';
import {countingOffsetStarts, generateCountingOffset} from './counting-offset.ts';

describe('counting offset candidate domains', () => {
    it.each(['inc', 'dec'] as const)('preserves all 648 three-digit ten-offset starts for %s', direction => {
        const starts = countingOffsetStarts({range: {min: 10, max: 1000}, direction}, 10, 'three-digit');
        const formerDomain = Array.from({length: 900}, (_, index) => index + 100).filter(start => {
            const answer = direction === 'inc' ? start + 10 : start - 10;
            return answer >= 100 && answer <= 1000 && !/0/.test(`${start}${answer}`);
        });
        expect(starts).toEqual(formerDomain);
        expect(starts).toHaveLength(648);
        expect(starts[0]).toBe(direction === 'inc' ? 111 : 121);
        expect(starts.at(-1)).toBe(direction === 'inc' ? 989 : 999);
    });

    it.each(['inc', 'dec'] as const)('preserves the restricted two-digit ten-offset domain for %s', direction => {
        const config = {range: {min: 10, max: 100}, direction};
        const starts = countingOffsetStarts(config, 10, 'two-digit');
        expect(starts).toEqual(countingOffsetStarts(config, 10));
        expect(starts).toHaveLength(72);
        for (const start of starts) {
            const answer = direction === 'inc' ? start + 10 : start - 10;
            expect(start).toBeGreaterThanOrEqual(10);
            expect(start).toBeLessThan(100);
            expect(answer).toBeGreaterThanOrEqual(10);
            expect(answer).toBeLessThan(100);
        }
    });

    it.each(['inc', 'dec'] as const)('preserves the three-digit hundred-offset domain for %s', direction => {
        const config = {range: {min: 100, max: 1000}, direction};
        const starts = countingOffsetStarts(config, 100, 'three-digit');
        expect(starts).toEqual(countingOffsetStarts(config, 100));
        expect(starts).toHaveLength(648);
    });

    it('keeps small valid starting operands available without an operand profile', () => {
        const config = {range: {min: 0, max: 120}, direction: 'inc' as const};
        expect(countingOffsetStarts(config, 100)).toEqual([11, 12, 13, 14, 15, 16, 17, 18, 19]);
        expect(countingOffsetStarts(config, 100, 'three-digit')).toEqual([]);
        expect(countingOffsetStarts({...config, direction: 'dec'}, 100, 'three-digit'))
            .toEqual([111, 112, 113, 114, 115, 116, 117, 118, 119]);
    });

    it.each([1, 10, 100] as const)('bounds the fixed %i operand and the hidden result', step => {
        for (const direction of ['inc', 'dec'] as const) {
            expect(countingOffsetStarts({range: {min: step + 1, max: 1000}, direction}, step)).toEqual([]);
            expect(countingOffsetStarts({range: {min: 0, max: step - 1}, direction}, step)).toEqual([]);
            for (const start of countingOffsetStarts({range: {min: step, max: 1000}, direction}, step)) {
                const answer = direction === 'inc' ? start + step : start - step;
                expect(answer).toBeGreaterThanOrEqual(step);
                expect(answer).toBeLessThanOrEqual(1000);
            }
        }
    });

    it.each([
        {min: 20, max: 10},
        {min: 0.5, max: 100},
        {min: 0, max: 100.5},
        {min: NaN, max: 100},
        {min: 0, max: Infinity}
    ])('rejects invalid numeric bounds: %j', range => {
        expect(countingOffsetStarts({range, direction: 'inc'}, 10)).toEqual([]);
    });

    it('rejects malformed or impossible direct configurations without drawing', () => {
        setSeed('invalid-offset');
        const before = getRandomState();
        expect(countingOffsetStarts({direction: 'inc'}, 10)).toEqual([]);
        expect(countingOffsetStarts({range: {min: 0, max: 100}, direction: 'other'} as never, 10)).toEqual([]);
        expect(countingOffsetStarts({range: {min: 0, max: 100}, direction: 'inc'}, 10, 'other' as never)).toEqual([]);
        expect(countingOffsetStarts({range: {min: 0, max: 1000}, direction: 'inc'}, 100, 'two-digit')).toEqual([]);
        expect(generateCountingOffset({range: {min: 0, max: 10}, direction: 'inc'}, 10)).toBeNull();
        expect(getRandomState()).toBe(before);
    });

    it('filters zero-digit transitions while keeping the surrounding valid domain', () => {
        const starts = countingOffsetStarts({range: {min: 0, max: 20}, direction: 'inc'}, 1);
        expect(starts).toContain(8);
        expect(starts).not.toContain(9);
        expect(starts).not.toContain(10);
        expect(starts).toContain(11);
        expect(starts).not.toContain(19);
    });

    it('retains the same seeded draw and payload when a profile preserves the domain', () => {
        const config = {range: {min: 10, max: 100}, direction: 'inc' as const};
        setSeed('profile-domain');
        random();
        const afterOneDraw = getRandomState();
        setSeed('profile-domain');
        const unprofiled = generateCountingOffset(config, 10);
        expect(getRandomState()).toBe(afterOneDraw);
        setSeed('profile-domain');
        expect(generateCountingOffset(config, 10, 'two-digit')).toEqual(unprofiled);
        expect(getRandomState()).toBe(afterOneDraw);
    });
});
