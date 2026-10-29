import type {ArithmeticEstimationProblem} from '../../../types/problems.ts';

type Context = Pick<ArithmeticEstimationProblem, 'numberDomain' | 'estimatedAnswer' | 'roundingPlace'>;
export interface ProposalCase {
    readonly proposedAnswer: number;
    readonly roundedProposedAnswer: number;
    readonly seeds: number;
    readonly witnessSeed: number;
}
const SEED_COUNT = 2 ** 32;
const cache = new Map<string, readonly ProposalCase[]>();
const round = (value: number, place: number) => Math.round(value / place) * place;
const gcd = (a: number, b: number): number => b ? gcd(b, a % b) : a;

function candidates(context: Context, residue: number) {
    const {min, max} = context.numberDomain, place = context.roundingPlace;
    const roundedEstimate = round(context.estimatedAnswer, place);
    const reasonable = residue % 2 === 0;
    const inDomain = (value: number) => Number.isInteger(value) && value >= min && value <= max;
    const admissible = (value: number) => inDomain(value) && value !== context.estimatedAnswer
        && inDomain(round(value, place)) && (round(value, place) === roundedEstimate) === reasonable;
    const offset = Math.floor(residue / 2) % place;
    const distance = reasonable ? 1 + offset % Math.max(1, place / 2 - 1) : place + offset;
    const direction = Math.floor(residue / 2) % 2 === 0 ? 1 : -1;
    return {preferred: [context.estimatedAnswer + direction * distance,
        context.estimatedAnswer - direction * distance].find(admissible),
        alternatives: () => Array.from({length: max - min + 1}, (_, index) => min + index).filter(admissible)};
}

/** Original projection algorithm, retained as a mathematical support witness. */
export function estimationProposalForSeed(context: Context, seed: number): ArithmeticEstimationProblem['proposal'] | null {
    const normalized = Number.isFinite(seed) ? Math.abs(Math.trunc(seed)) : 0;
    const options = candidates(context, normalized % 20);
    const alternatives = options.preferred === undefined ? options.alternatives() : [];
    const proposedAnswer = options.preferred ?? alternatives[normalized % alternatives.length];
    return proposedAnswer === undefined ? null : {proposedAnswer,
        roundedProposedAnswer: round(proposedAnswer, context.roundingPlace)};
}

/** Exact uniform unsigned32 seed measure; this is not a claim about deterministic hash frequencies. */
export function estimationProposalCases(context: Context, seedCount = SEED_COUNT): readonly ProposalCase[] {
    if (!Number.isSafeInteger(seedCount) || seedCount < 1 || seedCount > SEED_COUNT) throw new RangeError('Invalid presentation seed count.');
    const key = JSON.stringify([context.numberDomain.min, context.numberDomain.max, context.estimatedAnswer, context.roundingPlace, seedCount]);
    const cached = cache.get(key);
    if (cached) return cached;
    const cases = new Map<number, ProposalCase>();
    const add = (value: number, seeds: number, witnessSeed: number) => {
        const previous = cases.get(value);
        cases.set(value, {proposedAnswer: value, roundedProposedAnswer: round(value, context.roundingPlace),
            seeds: (previous?.seeds ?? 0) + seeds, witnessSeed: Math.min(previous?.witnessSeed ?? witnessSeed, witnessSeed)});
    };
    for (let residue = 0; residue < Math.min(20, seedCount); residue++) {
        const count = Math.floor((seedCount - 1 - residue) / 20) + 1;
        const options = candidates(context, residue);
        if (options.preferred !== undefined) {add(options.preferred, count, residue); continue;}
        const alternatives = options.alternatives();
        if (!alternatives.length) continue;
        const period = alternatives.length / gcd(20, alternatives.length);
        for (let offset = 0; offset < Math.min(period, count); offset++) {
            const seed = residue + 20 * offset;
            const occurrences = Math.floor((count - 1 - offset) / period) + 1;
            add(alternatives[seed % alternatives.length]!, occurrences, seed);
        }
    }
    const result = [...cases.values()].sort((a, b) => a.proposedAnswer - b.proposedAnswer);
    cache.set(key, result);
    return result;
}

export const proposalSeedCount = SEED_COUNT;
