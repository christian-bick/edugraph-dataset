import {random} from '../../lib/random.ts';

/** Inclusive positive-integer draw shared by scalar writing and rooted lengths. */
export function samplePositiveWholeNumber(range: {min: number; max: number}): number | null {
    const minNum = Math.max(1, Math.ceil(range.min));
    const maxNum = Math.floor(range.max);
    if (maxNum - minNum < 0) return null;
    return Math.floor(random() * (maxNum - minNum + 1)) + minNum;
}
