import {random} from '../../../lib/random.ts';
import type {ArithmeticWordProblemRounding} from '../../../types/problems.ts';

type Context = Pick<ArithmeticWordProblemRounding, 'numberDomain' | 'answer' | 'roundingPlace' | 'roundedAnswer'>;

/** Uniformly choose a distinct integer whose value and rounding stay in the mathematical domain. */
export function generateRoundingProposal(context: Context): ArithmeticWordProblemRounding['proposal'] | null {
    const {numberDomain: {min, max}, answer, roundingPlace, roundedAnswer} = context;
    const inDomain = (value: number) => Number.isSafeInteger(value) && value >= min && value <= max;
    if (!Number.isSafeInteger(min) || !Number.isSafeInteger(max) || min < 1 || min > max || max > 1_000_000
        || ![10, 100, 1000, 10000, 100000].includes(roundingPlace)
        || !inDomain(answer) || !inDomain(roundedAnswer)
        || roundedAnswer !== Math.round(answer / roundingPlace) * roundingPlace) return null;

    // Positive nearest-multiple buckets are [multiple - place/2, multiple + place/2).
    // Their union is one interval; intersect it with the declared domain before drawing.
    const lower = Math.max(min, Math.ceil(min / roundingPlace) * roundingPlace - roundingPlace / 2);
    const upper = Math.min(max, Math.floor(max / roundingPlace) * roundingPlace + roundingPlace / 2 - 1);
    const count = upper - lower; // The exact answer occupies one of the interval's integer positions.
    if (count < 1) return null;
    const position = lower + Math.floor(random() * count);
    const proposedAnswer = position >= answer ? position + 1 : position;
    return {proposedAnswer, roundedProposedAnswer: Math.round(proposedAnswer / roundingPlace) * roundingPlace};
}
