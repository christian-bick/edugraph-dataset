import {canonicalRangeProfiles} from '../../../lib/canonical-range-labels.ts';
import {hasCanonicalRangeWitness, type CanonicalNumericRange} from '../../../lib/canonical-numeric-range.ts';
import type {CountingSequenceProblem} from '../../../types/problems.ts';

export type SequenceStep = 1 | 5 | 10 | 100;
const cache = new Map<string, readonly CountingSequenceProblem[]>();

/** Preserve the complete union of the old declared finite range/step supports.
 * A source cap determined the old preferred length and truncated final runs;
 * retain those sequences instead of shortening them to manufacture a band. */
export function legacySequenceFrames(stepSize: SequenceStep, multiplesOfTen: boolean): readonly CountingSequenceProblem[] {
    if (![1, 5, 10, 100].includes(stepSize) || multiplesOfTen && stepSize !== 10) return [];
    const key = `${stepSize}:${multiplesOfTen}`;
    const cached = cache.get(key);
    if (cached) return cached;
    const frames = new Map<string, CountingSequenceProblem>();
    for (const maximum of [5, 10, 20, 100, 120, 1000]) {
        for (const minimum of [0, 5, 10, 20, 100, 120].filter(value => value < maximum)) {
            const first = multiplesOfTen ? Math.ceil(Math.max(1, minimum) / 10) * 10 : Math.max(1, minimum);
            const last = multiplesOfTen ? Math.floor(maximum / 10) * 10 : maximum;
            for (let start = first; start <= last - stepSize; start += stepSize) {
                const length = Math.min(stepSize === 1 && last < 100 ? 6 : 10, Math.floor((last - start) / stepSize) + 1);
                const sequence = Array.from({length}, (_, index) => start + index * stepSize);
                frames.set(sequence.join(','), {sequence, stepSize});
            }
        }
    }
    const result = [...frames.values()];
    cache.set(key, result);
    return result;
}

export const sequenceRangeProfiles = canonicalRangeProfiles.filter(({range}) => range.max <= 1000
    && ([1, 5, 10, 100] as const).some(step => legacySequenceFrames(step, false)
        .some(data => hasCanonicalRangeWitness(data.sequence, range))));

const domains = new Map<string, readonly CountingSequenceProblem[]>();
/** The implicit step is a sequence relation, not a separately requested arithmetic operand. */
export function sequenceFramesForRange(stepSize: SequenceStep, multiplesOfTen: boolean, range: CanonicalNumericRange) {
    const profile = sequenceRangeProfiles.find(profile => Object.entries(profile.range)
        .every(([key, value]) => range?.[key as keyof CanonicalNumericRange] === value));
    if (!profile) return [];
    const key = `${stepSize}:${multiplesOfTen}:${range.min}:${range.max}`;
    if (!domains.has(key)) domains.set(key, legacySequenceFrames(stepSize, multiplesOfTen)
        .filter(data => hasCanonicalRangeWitness(data.sequence, range)));
    return domains.get(key)!;
}
