import {createCanonicalNumericRange, type CanonicalNumericRange} from '../../../lib/canonical-numeric-range.ts';
import {GeneratorValidationError} from '../../../lib/errors.ts';
import type {MultiDigitDivisionProblem} from '../../../types/problems.ts';
import {partialQuotientHasZero} from './zero-profile.ts';

export interface DivisionCandidate {dividend: number; divisor: number; quotient: number; remainder: number}
export interface DivisionDomainRow {
    readonly divisor: number;
    readonly quotient: number;
    readonly remainders: readonly number[];
    readonly weight: number;
    readonly end: number;
}
export interface PartialQuotientDomain {
    readonly rows: readonly DivisionDomainRow[];
    readonly count: number;
    readonly weight: number;
}
const empty: PartialQuotientDomain = {rows: [], count: 0, weight: 0};
const domains = new Map<string, PartialQuotientDomain>();
const built = new Set<string>();
const key = (dividendDigits: number, divisorDigits: number, zero: boolean, lower: number, upper: number) =>
    `${dividendDigits}:${divisorDigits}:${zero}:${lower}:${upper}`;

/** Full decomposition addends, quotient chunks, products, subtraction states and final remainder. */
export const partialQuotientQuantities = (data: MultiDigitDivisionProblem): number[] => [
    data.dividend, data.divisor, data.quotient, data.remainder,
    ...data.dividendDecomposition.parts.map(part => part.value), ...data.divisorDecomposition.parts.map(part => part.value),
    ...data.partialQuotients.flatMap(step => [step.partialQuotient, step.partialProduct, step.remainingBefore, step.remainingAfter])
];

/** These compact rows condition the original exactness/divisor/quotient/remainder draw law. */
function buildDomains(dividendDigits: number, divisorDigits: number): void {
    const sourceKey = `${dividendDigits}:${divisorDigits}`;
    if (built.has(sourceKey)) return;
    built.add(sourceKey);
    if (divisorDigits > dividendDigits) return;
    const minimum = 10 ** (dividendDigits - 1), maximum = 10 ** dividendDigits - 1;
    const groups = new Map<string, {rows: DivisionDomainRow[]; count: number; weight: number}>();
    for (const exact of divisorDigits === 1 ? [false] : [false, true]) {
        const firstDivisor = divisorDigits === 1 ? 2 : 10;
        const lastDivisor = divisorDigits === 1 ? 9 : dividendDigits === 2 && !exact ? 98 : 99;
        for (let divisor = firstDivisor; divisor <= lastDivisor; divisor++) {
            const firstQuotient = Math.max(1, Math.ceil((minimum - (exact ? 0 : divisor - 1)) / divisor));
            const lastQuotient = Math.floor((maximum - (exact ? 0 : 1)) / divisor);
            for (let quotient = firstQuotient; quotient <= lastQuotient; quotient++) {
                const firstRemainder = exact ? 0 : Math.max(1, minimum - divisor * quotient);
                const lastRemainder = exact ? 0 : Math.min(divisor - 1, maximum - divisor * quotient);
                const weight = divisorDigits === 1 ? 1 : 0.5 / (lastDivisor - firstDivisor + 1)
                    / (lastQuotient - firstQuotient + 1) / (lastRemainder - firstRemainder + 1);
                const rowGroups = new Map<string, number[]>();
                for (let remainder = firstRemainder; remainder <= lastRemainder; remainder++) {
                    const dividend = divisor * quotient + remainder;
                    const zero = partialQuotientHasZero({dividend, divisor, quotient, remainder});
                    if (divisorDigits === 1 && zero) continue;
                    // All other positive required values lie above these ones components/remainder,
                    // and below the dividend. An internal zero coefficient supplies minimum zero.
                    const low = zero ? 0 : Math.min(dividend % 10, divisor % 10, quotient % 10, remainder);
                    const lower = low >= 5 ? 5 : 0;
                    const upper = [5, 10, 20, 100, 120, 1000, 10000].find(bound => dividend <= bound)!;
                    const groupKey = key(dividendDigits, divisorDigits, zero, lower, upper);
                    if (!rowGroups.has(groupKey)) rowGroups.set(groupKey, []);
                    rowGroups.get(groupKey)!.push(remainder);
                }
                for (const [groupKey, remainders] of rowGroups) {
                    if (!groups.has(groupKey)) groups.set(groupKey, {rows: [], count: 0, weight: 0});
                    const group = groups.get(groupKey)!;
                    group.count += remainders.length;
                    group.weight += weight * remainders.length;
                    group.rows.push({divisor, quotient, remainders, weight, end: group.weight});
                }
            }
        }
    }
    for (const [groupKey, domain] of groups) domains.set(groupKey, domain);
}

export function partialQuotientDomain(dividendDigits: number, divisorDigits: number, zero: boolean,
    range: CanonicalNumericRange): PartialQuotientDomain {
    if (![1, 2, 3, 4].includes(dividendDigits) || ![1, 2].includes(divisorDigits) || typeof zero !== 'boolean'
        || !range || ![5, 10, 20, 100, 120, 1000, 10000].includes(range.max)
        || ![0, 5].includes(range.min) || range.min >= range.max) {
        throw new GeneratorValidationError('multi-digit-division', 'Expected supported widths, zero involvement and reviewed canonical numeric bounds.');
    }
    const expected = createCanonicalNumericRange(range.max, range.min);
    if (range.maximumAbove !== expected.maximumAbove || range.minimumBelow !== expected.minimumBelow) {
        throw new GeneratorValidationError('multi-digit-division', 'Canonical range witnesses are missing or inconsistent.');
    }
    buildDomains(dividendDigits, divisorDigits);
    return domains.get(key(dividendDigits, divisorDigits, zero, range.min, range.max)) ?? empty;
}

/** A weighted position keeps each remainder's original path probability, without rejection retries. */
export function partialQuotientFrame(domain: PartialQuotientDomain, position: number): DivisionCandidate {
    if (!Number.isFinite(position) || position < 0 || position >= domain.weight) {
        throw new GeneratorValidationError('multi-digit-division', 'Expected an admitted weighted-domain position.');
    }
    let low = 0, high = domain.rows.length - 1;
    while (low < high) {
        const middle = (low + high) >>> 1;
        if (position < domain.rows[middle]!.end) high = middle;
        else low = middle + 1;
    }
    const row = domain.rows[low]!;
    const index = Math.min(row.remainders.length - 1, Math.floor((position - (row.end - row.weight * row.remainders.length)) / row.weight));
    const remainder = row.remainders[Math.max(0, index)]!;
    return {dividend: row.divisor * row.quotient + remainder, divisor: row.divisor, quotient: row.quotient, remainder};
}
