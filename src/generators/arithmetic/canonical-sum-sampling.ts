import type {CanonicalNumericRange} from '../../lib/canonical-numeric-range.ts';
import {random} from '../../lib/random.ts';

export interface CanonicalSumDomain {
    readonly count: number;
    readonly range: CanonicalNumericRange;
    readonly minimumOperand: number;
    readonly maximumOperand: number;
    readonly step: number;
    /** A separate required zero already supplies the minimum witness. */
    readonly zeroWitness?: boolean;
    readonly distinctOperands?: boolean;
}

function sumBounds(domain: CanonicalSumDomain) {
    const {count, range, step} = domain;
    if (![count, range.min, range.max, range.maximumAbove, range.minimumBelow,
        domain.minimumOperand, domain.maximumOperand, step].every(Number.isFinite)
        || !Number.isInteger(count) || count < 1 || domain.distinctOperands && count < 2
        || step < 1 || range.min >= range.max) return null;
    const min = Math.ceil(Math.max(1, range.min, domain.minimumOperand) / step);
    const max = Math.floor(Math.min(range.max, domain.maximumOperand) / step);
    const smallMax = Math.min(max, domain.zeroWitness ? max : Math.ceil(range.minimumBelow / step) - 1);
    const distinct = domain.distinctOperands ? 1 : 0;
    const totalMin = Math.max(count * min + distinct, Math.floor(range.maximumAbove / step) + 1);
    const totalMax = Math.min(Math.floor(range.max / step), count * max - distinct, (count - 1) * max + smallMax);
    return min <= smallMax && totalMin <= totalMax ? {min, max, smallMax, totalMin, totalMax} : null;
}

export const canSampleCanonicalSum = (domain: CanonicalSumDomain): boolean => sumBounds(domain) !== null;
const integer = (min: number, max: number): number => min + Math.floor(random() * (max - min + 1));

/** Choose a feasible total, reserve a minimum witness, then distribute the rest within exact bounds. */
export function sampleCanonicalSum(domain: CanonicalSumDomain): number[] | null {
    const bounds = sumBounds(domain);
    if (!bounds) return null;
    const {min, max, smallMax} = bounds;
    let remaining = integer(bounds.totalMin, bounds.totalMax);
    const first = integer(Math.max(min, remaining - (domain.count - 1) * max),
        Math.min(smallMax, remaining - (domain.count - 1) * min));
    const values = [first];
    remaining -= first;
    for (let index = 1; index < domain.count; index++) {
        const rest = domain.count - index - 1;
        const value = integer(Math.max(min, remaining - rest * max), Math.min(max, remaining - rest * min));
        values.push(value);
        remaining -= value;
    }
    if (domain.distinctOperands && values.every(value => value === values[0])) {
        // Interior equal compositions have room on both sides; preserve the total and minimum witness.
        values[0]!--;
        values[1]!++;
    }
    for (let index = values.length - 1; index > 0; index--) {
        const other = integer(0, index);
        [values[index], values[other]] = [values[other]!, values[index]!];
    }
    return values.map(value => value * domain.step);
}
