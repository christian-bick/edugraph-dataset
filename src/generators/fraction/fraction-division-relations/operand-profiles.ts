import type {FractionQuotientValue} from '../../../types/problems.ts';

const fractionDenominators = [2, 3, 4, 6] as const;
export const divisionOperandProfiles = {
    'fraction-by-fraction-proper': {kind: 'fraction-by-fraction', proper: true},
    'fraction-by-fraction-improper': {kind: 'fraction-by-fraction', proper: false},
    'fraction-by-integer-proper': {kind: 'fraction-by-integer', proper: true},
    'fraction-by-integer-improper': {kind: 'fraction-by-integer', proper: false},
    'integer-by-fraction-proper': {kind: 'integer-by-fraction', proper: true},
    'integer-by-fraction-improper': {kind: 'integer-by-fraction', proper: false}
} as const;
export type DivisionOperandProfile = keyof typeof divisionOperandProfiles;
export type DivisionGroupCountProfile = 'zero' | 'positive';
export type WeightedDivisionOperands = Readonly<{
    dividend: Readonly<FractionQuotientValue>;
    divisor: Readonly<FractionQuotientValue>;
    /** Probability in the original role's unconditioned finite sampler. */
    weight: number;
}>;
const distributions = new Map<DivisionOperandProfile, Readonly<Record<DivisionGroupCountProfile, readonly WeightedDivisionOperands[]>>>();

/** Condition original expressed operand probabilities on magnitude and complete-group count. */
export function divisionOperandDistribution(profile: DivisionOperandProfile, groupCount: DivisionGroupCountProfile): readonly WeightedDivisionOperands[] {
    if (!Object.hasOwn(divisionOperandProfiles, profile) || !['zero', 'positive'].includes(groupCount)) {
        throw new Error('Choose a supported division operand and complete-group profile.');
    }
    if (!distributions.has(profile)) {
        const {kind, proper} = divisionOperandProfiles[profile];
        const classifyDividend = kind !== 'integer-by-fraction';
        const firstDenominators = classifyDividend ? fractionDenominators : [1];
        const secondDenominators = kind === 'fraction-by-integer' ? [1] : fractionDenominators;
        const groups: Record<DivisionGroupCountProfile, WeightedDivisionOperands[]> = {zero: [], positive: []};
        for (const b of firstDenominators) for (const d of secondDenominators) {
            const firstMin = classifyDividend && !proper ? b : 0;
            const firstMax = classifyDividend && proper ? b - 1 : 4 * b;
            const secondMin = !classifyDividend && !proper ? d : 1;
            const secondMax = !classifyDividend && proper ? d - 1 : 4 * d;
            const weight = 1 / firstDenominators.length / secondDenominators.length / (4 * b + 1) / (4 * d);
            for (let a = firstMin; a <= firstMax; a++) for (let c = secondMin; c <= secondMax; c++) {
                const quantity = a * d < c * b ? 'zero' : 'positive';
                groups[quantity].push(Object.freeze({dividend: Object.freeze({numerator: a, denominator: b}),
                    divisor: Object.freeze({numerator: c, denominator: d}), weight}));
            }
        }
        distributions.set(profile, Object.freeze({zero: Object.freeze(groups.zero), positive: Object.freeze(groups.positive)}));
    }
    return distributions.get(profile)![groupCount];
}

/** One bounded weighted draw; cached values never escape into mutable problem payloads. */
export function sampleDivisionOperands(profile: DivisionOperandProfile, groupCount: DivisionGroupCountProfile, draw: number): {
    dividend: FractionQuotientValue; divisor: FractionQuotientValue
} {
    if (!Number.isFinite(draw) || draw < 0 || draw >= 1) throw new Error('Division operand draw must be in [0, 1).');
    const candidates = divisionOperandDistribution(profile, groupCount);
    if (!candidates.length) throw new Error('The division operand and complete-group profiles have no common instance.');
    const total = candidates.reduce((sum, candidate) => sum + candidate.weight, 0);
    let position = draw * total;
    const selected = candidates.find((candidate, index) => (position -= candidate.weight) < 0 || index === candidates.length - 1)!;
    return {dividend: {...selected.dividend}, divisor: {...selected.divisor}};
}
