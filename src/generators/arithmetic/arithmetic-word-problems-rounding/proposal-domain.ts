import {random} from '../../../lib/random.ts';
import type {ArithmeticWordProblemRounding} from '../../../types/problems.ts';

type Context = Pick<ArithmeticWordProblemRounding, 'numberDomain' | 'answer' | 'roundingPlace' | 'roundedAnswer'>;
export type ProposalInterval = Readonly<{lower: number; upper: number}>;

/** Exact positive nearest-multiple buckets, before any proposal randomness. */
export function roundingProposalInterval(context: Context): ProposalInterval | null {
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
    return upper - lower >= 1 ? {lower, upper} : null;
}

/** Uniformly choose a distinct integer, optionally conditioned on a proven subinterval. */
export function generateRoundingProposal(context: Context, allowed?: ProposalInterval): ArithmeticWordProblemRounding['proposal'] | null {
    const original = roundingProposalInterval(context);
    if (!original) return null;
    const {lower, upper} = allowed ?? original;
    if (!Number.isSafeInteger(lower) || !Number.isSafeInteger(upper) || lower < original.lower || upper > original.upper) return null;
    const {answer, roundingPlace} = context;
    const excludes = answer >= lower && answer <= upper;
    const count = upper - lower + 1 - Number(excludes);
    if (count < 1) return null;
    const position = lower + Math.floor(random() * count);
    const proposedAnswer = excludes && position >= answer ? position + 1 : position;
    return {proposedAnswer, roundedProposedAnswer: Math.round(proposedAnswer / roundingPlace) * roundingPlace};
}
