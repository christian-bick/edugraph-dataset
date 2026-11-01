import {createCanonicalNumericRange, type CanonicalNumericRange} from '../../../lib/canonical-numeric-range.ts';
import {GeneratorValidationError} from '../../../lib/errors.ts';

export interface CommonRelationProfile {
    readonly operation: 'gcd' | 'lcm';
    readonly range: CanonicalNumericRange;
}

export interface WeightedRelationInputs {
    readonly inputs: readonly [number, number];
    readonly weight: number;
}

const gcd = (first: number, second: number): number => {
    while (second !== 0) [first, second] = [second, first % second];
    return first;
};

/** Aggregate the original five-scenario law, including overlapping boundary scenarios. */
const originalWeight = (first: number, second: number, operation: 'gcd' | 'lcm'): number => {
    const maximum = operation === 'gcd' ? 100 : 12;
    let weight = 1 / (5 * (maximum + 1) * (operation === 'gcd' && first === 0 ? maximum : maximum + 1));
    if (first === second && first > 0) weight += 1 / (5 * maximum);
    if ((first === 0) !== (second === 0)) weight += 1 / (10 * maximum);
    if (operation === 'gcd') {
        if (first === 100 && second > 0) weight += 1 / 500;
        if (first > 0 && second === first + 1) weight += 1 / (5 * 99);
    } else {
        if (first === 0 && second === 0) weight += 1 / 5;
        if (first === 11 && second === 12) weight += 1 / 5;
    }
    return weight;
};

const domains = new Map<string, readonly WeightedRelationInputs[]>();

/** GCD uses its own proof, not the unused stored LCM. Factor1 or zero prevents a positive floor. */
export function commonRelationDomain({operation, range}: CommonRelationProfile): readonly WeightedRelationInputs[] {
    const uppers = operation === 'gcd' ? [5, 10, 20, 100] : operation === 'lcm' ? [5, 10, 20, 100, 120, 1000] : [];
    if (!range || range.min !== 0 || !uppers.includes(range.max)) {
        throw new GeneratorValidationError('common-factor-multiple-relations', 'Expected a reviewed operation and canonical upper band without a positive lower.');
    }
    const expected = createCanonicalNumericRange(range.max);
    if (range.maximumAbove !== expected.maximumAbove || range.minimumBelow !== expected.minimumBelow) {
        throw new GeneratorValidationError('common-factor-multiple-relations', 'Canonical range witnesses are missing or inconsistent.');
    }
    const key = `${operation}:${range.max}`;
    if (!domains.has(key)) {
        const maximum = operation === 'gcd' ? 100 : 12;
        const candidates: WeightedRelationInputs[] = [];
        for (let first = 0; first <= maximum; first++) for (let second = 0; second <= maximum; second++) {
            if (operation === 'gcd' && first === 0 && second === 0) continue;
            const result = operation === 'gcd' ? gcd(first, second)
                : first === 0 || second === 0 ? 0 : first * second / gcd(first, second);
            const largest = Math.max(first, second, result);
            if (largest > range.maximumAbove && largest <= range.max) {
                candidates.push({inputs: [first, second], weight: originalWeight(first, second, operation)});
            }
        }
        domains.set(key, candidates);
    }
    return domains.get(key)!;
}
