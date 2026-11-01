import {createCanonicalNumericRange, hasCanonicalRangeWitness, type CanonicalNumericRange} from '../../../lib/canonical-numeric-range.ts';
import {GeneratorValidationError} from '../../../lib/errors.ts';
import type {KnownFactDerivationProblem, KnownFactDerivationStrategy} from '../../../types/problems.ts';

/** These quantities occur in both understanding and inversion of the supplied known fact. */
export const knownFactQuantities = (data: KnownFactDerivationProblem): number[] => [
    data.knownFact.firstFactor, data.knownFact.secondFactor, data.knownFact.product,
    ...data.derivedOperands, data.answer, ...(data.strategy === 'place-value-scaling' ? [10] : [])
];

export function knownFactStrategy(operation: 'multiplication' | 'division', arity: 2 | 3,
    commutative: boolean, associative: boolean, scaling: boolean): KnownFactDerivationStrategy | undefined {
    if (Number(commutative) + Number(associative) + Number(scaling) > 1
        || (commutative || scaling) && (operation !== 'multiplication' || arity !== 2)
        || associative && (operation !== 'multiplication' || arity !== 3)
        || arity === 3 && !associative) return undefined;
    return associative ? 'associative' : scaling ? 'place-value-scaling'
        : operation === 'division' ? 'inverse-division' : 'commutative';
}

const frames: Record<KnownFactDerivationStrategy, KnownFactDerivationProblem[]> = {
    commutative: [], associative: [], 'inverse-division': [], 'place-value-scaling': []
};
for (let first = 2; first <= 9; first++) for (let second = 2; second <= 9; second++) {
    const knownFact = {firstFactor: first, secondFactor: second, product: first * second};
    if (first !== second) frames.commutative.push({strategy: 'commutative', operation: 'multiplication', knownFact,
        derivedOperands: [second, first], answer: knownFact.product});
    frames['inverse-division'].push({strategy: 'inverse-division', operation: 'division', knownFact,
        derivedOperands: [knownFact.product, first], answer: second});
    frames['place-value-scaling'].push({strategy: 'place-value-scaling', operation: 'multiplication', knownFact,
        derivedOperands: [first, second * 10], answer: knownFact.product * 10});
    for (let outer = 2; outer <= 9; outer++) frames.associative.push({strategy: 'associative', operation: 'multiplication', knownFact,
        derivedOperands: [outer, first, second], answer: outer * knownFact.product});
}

const domains = new Map<string, readonly KnownFactDerivationProblem[]>();

/** Ordinary profiles condition the original finite domain before the one uniform mathematical draw. */
export function knownFactDomain(strategy: KnownFactDerivationStrategy, range: CanonicalNumericRange): readonly KnownFactDerivationProblem[] {
    if (!Object.hasOwn(frames, strategy) || !range || ![5, 10, 20, 100, 120, 1000].includes(range.max)
        || ![0, 5].includes(range.min) || range.min >= range.max) {
        throw new GeneratorValidationError('arithmetic-known-fact-derivation', 'Expected a known strategy and reviewed canonical numeric bounds.');
    }
    const expected = createCanonicalNumericRange(range.max, range.min);
    if (range.maximumAbove !== expected.maximumAbove || range.minimumBelow !== expected.minimumBelow) {
        throw new GeneratorValidationError('arithmetic-known-fact-derivation', 'Canonical range witnesses are missing or inconsistent.');
    }
    const key = `${strategy}:${range.min}:${range.max}`;
    if (!domains.has(key)) domains.set(key, frames[strategy].filter(data => hasCanonicalRangeWitness(knownFactQuantities(data), range)));
    return domains.get(key)!;
}
