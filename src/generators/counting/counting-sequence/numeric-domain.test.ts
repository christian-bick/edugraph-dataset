import {describe, expect, it} from 'vitest';
import {createCanonicalNumericRange, hasCanonicalRangeWitness} from '../../../lib/canonical-numeric-range.ts';
import {legacySequenceFrames, sequenceFramesForRange, sequenceRangeProfiles, type SequenceStep} from './numeric-domain.ts';

function originalFrames(step: number, multiples: boolean) {
    const result = new Set<string>();
    for (const max of [5, 10, 20, 100, 120, 1000]) for (const min of [0, 5, 10, 20, 100, 120]) {
        if (min >= max) continue;
        const first = multiples ? Math.ceil(Math.max(1, min) / 10) * 10 : Math.max(1, min);
        const last = multiples ? Math.floor(max / 10) * 10 : max;
        const starts = Math.floor((last - step - first) / step) + 1;
        for (let draw = 0; draw < starts; draw++) {
            const start = first + draw * step;
            const length = Math.min(step === 1 && last < 100 ? 6 : 10, Math.floor((last - start) / step) + 1);
            result.add(Array.from({length}, (_, index) => start + index * step).join(','));
        }
    }
    return result;
}

describe('canonical number-sequence support', () => {
    it.each([[1, false], [5, false], [10, false], [100, false], [10, true]] as const)(
        'retains every old step%s/multiples%s sequence in exactly one canonical profile', (step, multiples) => {
            const old = originalFrames(step, multiples), current = legacySequenceFrames(step, multiples);
            expect(new Set(current.map(data => data.sequence.join(',')))).toEqual(old);
            const partition = sequenceRangeProfiles.flatMap(profile => sequenceFramesForRange(step, multiples, profile.range));
            expect(partition).toHaveLength(old.size);
            expect(new Set(partition.map(data => data.sequence.join(',')))).toEqual(old);
            for (const profile of sequenceRangeProfiles) for (const data of sequenceFramesForRange(step, multiples, profile.range)) {
                if (!hasCanonicalRangeWitness(data.sequence, profile.range)) throw new Error(`Noncanonical ${data.sequence}`);
            }
        });

    it('includes ordinary endpoints and omits the universal floor without treating an implicit step as an operand', () => {
        const data = {sequence: [100, 110, 120], stepSize: 10};
        const range = createCanonicalNumericRange(120, 100);
        expect(sequenceFramesForRange(10, false, range)).toContainEqual(data);
        expect(hasCanonicalRangeWitness([...data.sequence, data.stepSize], range)).toBe(false);
        expect(sequenceRangeProfiles.every(profile => profile.range.min !== profile.range.max)).toBe(true);
        expect(sequenceFramesForRange(100, false, createCanonicalNumericRange(100))).toEqual([]);
    });

    it('rejects unsupported step/multiple and malformed range combinations', () => {
        expect(legacySequenceFrames(2 as SequenceStep, false)).toEqual([]);
        expect(legacySequenceFrames(1, true)).toEqual([]);
        for (const range of [undefined, {}, {min: 0, max: 1000}, createCanonicalNumericRange(10000)]) {
            expect(sequenceFramesForRange(1, false, range as never)).toEqual([]);
        }
        expect(legacySequenceFrames(1, false)).toBe(legacySequenceFrames(1, false));
    });
});
