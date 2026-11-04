import {canonicalRangeProfiles} from '../../lib/canonical-range-labels.ts';
import {hasCanonicalRangeWitness, type CanonicalNumericRange} from '../../lib/canonical-numeric-range.ts';
import {GeneratorValidationError} from '../../lib/errors.ts';
import type {CountingEnumerationProblem, CountingProblem, CountingTotalProblem} from '../../types/problems.ts';
import {sampleCountingQuantity} from './counting-quantity.ts';
import type {ParityConstraint} from './helpers.ts';

export type BasicCountingContract = 'enumeration' | 'total';
const profiles = {
    enumeration: canonicalRangeProfiles.filter(({range}) => range.min === 0 && [5, 10, 20].includes(range.max)),
    total: canonicalRangeProfiles.filter(({range}) => range.min === 0 && range.max === 5
        || range.min === 5 && range.max === 10 || range.min === 10 && range.max === 20)
};

/** Static canonical alternatives; importing a catalog never constructs native count pools. */
export const basicCountingProfiles = (contract: BasicCountingContract) => profiles[contract];

const domains = new Map<string, readonly number[]>();
/** Native cardinalities conditioned on the complete range witness and the parity of the total. */
export function basicCountingCounts(contract: BasicCountingContract, range: CanonicalNumericRange,
    parity: ParityConstraint): readonly number[] {
    const moduleId = contract === 'enumeration' ? 'counting-basic' : 'counting-total';
    const profile = profiles[contract].find(profile => Object.entries(profile.range).every(([key, value]) =>
        range?.[key as keyof CanonicalNumericRange] === value));
    if (!profile) throw new GeneratorValidationError(moduleId, 'Choose a supported canonical counting range.');
    if (!['any', 'even', 'odd'].includes(parity))
        throw new GeneratorValidationError(moduleId, 'Choose a supported cardinality parity.');
    const key = `${contract}:${profile.range.min}:${profile.range.max}:${parity}`, cached = domains.get(key);
    if (cached) return cached;
    const counts = Array.from({length: 20}, (_, index) => index + 1).filter(count =>
        (parity === 'any' || count % 2 === (parity === 'even' ? 0 : 1))
        && hasCanonicalRangeWitness(contract === 'enumeration' ? [1, count] : [count], profile.range));
    domains.set(key, counts);
    return counts;
}

/** Every supported cell is nonempty and contiguous within its selected parity, so one draw suffices. */
export function sampleBasicCountingQuantity(contract: BasicCountingContract, range: CanonicalNumericRange,
    parity: ParityConstraint, draw: () => number): CountingProblem {
    const counts = basicCountingCounts(contract, range, parity);
    return sampleCountingQuantity({min: counts[0]!, max: counts[counts.length - 1]!}, parity, draw)!;
}

export const buildCountingEnumeration = (quantity: CountingProblem): CountingEnumerationProblem => ({
    kind: 'counting-enumeration', numObjects: quantity.numObjects, simpleAnswer: quantity.simpleAnswer,
    ...(quantity.parity === undefined ? {} : {parity: quantity.parity}),
    countingNumbers: Array.from({length: quantity.numObjects}, (_, index) => index + 1)
});

export const buildCountingTotal = (quantity: CountingProblem): CountingTotalProblem => ({
    kind: 'counting-total', numObjects: quantity.numObjects, simpleAnswer: quantity.simpleAnswer,
    ...(quantity.parity === undefined ? {} : {parity: quantity.parity})
});
