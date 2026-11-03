import {Area, Scope} from 'edugraph-ts';
import {exactResolver, withLabelChoices} from '../../../types/schema.ts';
import {random} from '../../../lib/random.ts';
import {makeSignedRational} from '../../number/signed-rational-helpers.ts';
import type {SignedRational} from '../../../types/problems.ts';

export const numericProfileBundles = [
    [Scope.NumbersWithoutNegatives, Scope.NumbersWithoutZero],
    [Scope.NumbersWithoutNegatives, Scope.NumbersWithZero],
    [Scope.NumbersWithNegatives, Scope.NumbersWithoutZero],
    [Scope.NumbersWithNegatives, Scope.NumbersWithZero]
] as const;
export type NumericProfile = 1 | 2 | 3 | 4;
export type SinglePowerCandidate = {base: SignedRational; exponent: number; weight: number};
export const numericProfileLabels = [...new Set(numericProfileBundles.flat())];

export const resolveNumericProfile = withLabelChoices(exactResolver((labels: string[]): NumericProfile | undefined => {
    const selected = labels.filter(label => numericProfileLabels.includes(label as never));
    const index = numericProfileBundles.findIndex(bundle => bundle.length === selected.length
        && bundle.every(label => selected.includes(label)));
    if (index < 0 || index === 3 && labels.includes(Scope.PositiveExponent)
        && !labels.includes(Area.OrderOfOperations)) return undefined;
    return (index + 1) as NumericProfile;
}), {
    kind: 'alternatives', alternatives: numericProfileBundles,
    contextLabels: [Area.OrderOfOperations, Scope.PositiveExponent]
});

/** Constrains all exact mathematical values, including written exponents and intermediate results. */
export const permitsNumericValues = (numerators: readonly number[], profile: NumericProfile): boolean =>
    numerators.some(value => value < 0) === (profile > 2)
    && numerators.some(value => value === 0) === (profile % 2 === 0);

/** The original exponent/denominator/numerator/sign draws, before rational reduction. */
export function singlePowerCandidates(positiveExponent: boolean, profile: NumericProfile): SinglePowerCandidate[] {
    const candidates: SinglePowerCandidate[] = [];
    const exponentCount = positiveExponent ? 3 : 4;
    for (let exponent = positiveExponent ? 1 : 0; exponent <= 3; exponent++) {
        for (let denominator = 1; denominator <= 4; denominator++) {
            const first = exponent === 0 ? 1 : 0;
            const count = 3 * denominator - first + 1;
            for (let magnitude = first; magnitude <= 3 * denominator; magnitude++) {
                for (const sign of [-1, 1]) {
                    const negative = magnitude > 0 && sign < 0;
                    const zero = magnitude === 0 || exponent === 0;
                    const id = negative ? zero ? 4 : 3 : zero ? 2 : 1;
                    if (id !== profile) continue;
                    candidates.push({base: makeSignedRational(magnitude * sign, denominator), exponent,
                        weight: 1 / exponentCount / 4 / count / 2});
                }
            }
        }
    }
    return candidates;
}

export function sampleSinglePower(positiveExponent: boolean, profile: NumericProfile) {
    return sampleSinglePowerCandidate(singlePowerCandidates(positiveExponent, profile));
}

/** Condition the original finite draw law without discarding duplicate weighted paths. */
export function sampleSinglePowerCandidate(candidates: readonly SinglePowerCandidate[]) {
    if (!candidates.length) return null;
    let remaining = random() * candidates.reduce((sum, candidate) => sum + candidate.weight, 0);
    return candidates.find(candidate => (remaining -= candidate.weight) < 0) ?? candidates[candidates.length - 1]!;
}
