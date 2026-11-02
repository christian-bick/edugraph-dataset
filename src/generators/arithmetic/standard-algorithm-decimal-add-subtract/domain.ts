import {createCanonicalNumericRange, type CanonicalNumericRange} from '../../../lib/canonical-numeric-range.ts';
import {GeneratorValidationError} from '../../../lib/errors.ts';

type Operation = 'addition' | 'subtraction';
export const STANDARD_DECIMAL_COLUMN_UPPERS = [10, 20, 100, 120, 1000, 10000, 100000] as const;
const cap = 1000000;
let digitPrefix: Uint32Array | undefined;

/** Count positive coefficients whose active digits are all nonzero. */
export function nonzeroDecimalDigitsAtMost(limit: number): number {
    if (limit < 1) return 0;
    if (!digitPrefix) {
        digitPrefix = new Uint32Array(cap + 1);
        const valid = new Uint8Array(cap + 1);
        for (let n = 1; n <= cap; n++) {
            valid[n] = n % 10 !== 0 && (n < 10 || valid[Math.floor(n / 10)] === 1) ? 1 : 0;
            digitPrefix[n] = digitPrefix[n - 1]! + valid[n]!;
        }
    }
    return digitPrefix[Math.min(cap, Math.floor(limit))]!;
}
const nonzeroDigits = (value: number) => nonzeroDecimalDigitsAtMost(value) > nonzeroDecimalDigitsAtMost(value - 1);

/** For each possible bottom width, count nonzero subtraction paths by an LSD
 * borrow automaton. Ending a shorter bottom must also clear any borrow without
 * exhausting the next top unit. All higher inactive bottom digits are omitted. */
export function nonzeroSubtractionCount(top: number, scale: number): number {
    if (!nonzeroDigits(top)) return 0;
    const digits = String(top).split('').reverse().map(Number);
    let withoutBorrow = 1, withBorrow = 0, total = 0;
    for (let position = 0; position < digits.length; position++) {
        const t = digits[position]!;
        const nextWithout = withoutBorrow * (t - 1) + withBorrow * Math.max(0, t - 2);
        const nextWith = withoutBorrow * (9 - t) + (t > 1 ? withBorrow * (10 - t) : 0);
        withoutBorrow = nextWithout;
        withBorrow = nextWith;
        if (position >= scale) total += withoutBorrow
            + (position + 1 < digits.length && digits[position + 1]! > 1 ? withBorrow : 0);
    }
    return total;
}

/** Bounded counterpart for exact rank selection (and its zero complement).
 * A higher digit overrides the comparison state built by lower digits. */
export function nonzeroSubtractionAtMost(top: number, scale: number, limit: number): number {
    if (!nonzeroDigits(top) || limit < 10 ** scale) return 0;
    if (limit >= top) return nonzeroSubtractionCount(top, scale);
    const digits = String(top).split('').reverse().map(Number);
    const ceiling = String(Math.floor(limit)).padStart(digits.length, '0').split('').reverse().map(Number);
    let total = 0;
    for (let length = scale + 1; length <= digits.length; length++) {
        let states = [0, 1, 0, 0, 0, 0]; // borrow * 3 + comparison (-1,0,1)
        for (let p = 0; p < digits.length; p++) {
            const next = [0, 0, 0, 0, 0, 0];
            for (let borrow = 0; borrow <= 1; borrow++) for (let comparison = -1; comparison <= 1; comparison++) {
                const mass = states[borrow * 3 + comparison + 1]!;
                const before = digits[p]! - borrow;
                if (!mass || before <= 0) continue;
                for (let b = p < length ? 1 : 0; b <= (p < length ? 9 : 0); b++) {
                    const outgoing = before < b ? 1 : 0;
                    if (before + 10 * outgoing - b === 0) continue;
                    const cmp = b === ceiling[p] ? comparison : b < ceiling[p]! ? -1 : 1;
                    next[outgoing * 3 + cmp + 1]! += mass;
                }
            }
            states = next;
        }
        total += states[0]! + states[1]!;
    }
    return total;
}

interface RegularDomain {
    readonly kind: 'regular';
    readonly operation: Operation;
    readonly scale: number;
    readonly bottomScale: number;
    readonly first: number;
    readonly last: number;
    readonly all?: Float64Array;
    readonly nonzero?: Float64Array;
    readonly prior: number;
}
export type DecimalColumnPair = Readonly<{top: number; topScale: number; bottom: number; bottomScale: number}>;
type Domain = RegularDomain
    | Readonly<{kind: 'pair'; pair: DecimalColumnPair; prior: number}>
    | Readonly<{kind: 'borrow'; first: number; last: number; prior: number}>
    | Readonly<{kind: 'zero-addend'; whole: number; first: number; last: number; prior: number}>
    | Readonly<{kind: 'equal'; first: number; last: number; prior: number}>;
export type DecimalColumnCase = Domain & Readonly<{weight: number}>;
const regularCache = new Map<string, readonly RegularDomain[]>();
const cache = new Map<string, readonly DecimalColumnCase[]>();

const prefix = (domain: RegularDomain, top: number, nonzero: boolean): number => {
    if (top < domain.first) return 0;
    const index = Math.min(top, domain.last) - domain.first;
    return nonzero ? domain.nonzero?.[index] ?? 0 : domain.all?.[index] ?? index + 1;
};
const acceptedPrefix = (domain: RegularDomain, top: number, zero: boolean) => zero
    ? prefix(domain, top, false) - prefix(domain, top, true) : prefix(domain, top, true);

const bottomInterval = (domain: RegularDomain, top: number, range: CanonicalNumericRange): readonly [number, number] => {
    const factor = 10 ** (domain.scale - domain.bottomScale);
    const maximum = Math.floor((domain.operation === 'addition' ? cap - top : top) / factor);
    return domain.operation === 'subtraction' ? [0, maximum] : [
        Math.max(0, Math.ceil((range.maximumAbove * 10 ** domain.scale + 1 - top) / factor)),
        Math.min(maximum, Math.floor((range.max * 10 ** domain.scale - top) / factor))
    ];
};

/** Marginalize the original variant/precision/top/bottom law over compact
 * bottom intervals. Same-precision nonzero paths use integer digit counts;
 * every other precision has a required aligned zero unit. */
function regularDomains(operation: Operation, range: CanonicalNumericRange): readonly RegularDomain[] {
    const key = `${operation}:${range.max}`, old = regularCache.get(key);
    if (old) return old;
    const result: RegularDomain[] = [];
    for (let scale = 1; scale <= 3; scale++) {
        const power = 10 ** scale, sourceFirst = 10 * power, sourceLast = operation === 'addition' ? cap / 2 : cap;
        if (range.maximumAbove >= cap / power) continue;
        const first = operation === 'addition' ? sourceFirst : Math.max(sourceFirst, range.maximumAbove * power + 1);
        const last = Math.min(sourceLast, range.max * power);
        if (first > last) continue;
        for (let bottomScale = 0; bottomScale <= scale; bottomScale++) {
            const all = operation === 'addition' ? new Float64Array(last - first + 1) : undefined;
            const nonzero = bottomScale === scale ? new Float64Array(last - first + 1) : undefined;
            const prior = 1 / 4 / 3 * (1 / (scale + 1) + (bottomScale < scale ? 1 / scale : 0))
                / (sourceLast - sourceFirst + 1);
            const domain: RegularDomain = {kind: 'regular', operation, scale, bottomScale, first, last, all, nonzero, prior};
            let allMass = 0, nonzeroMass = 0;
            for (let top = first; top <= last; top++) {
                const [lo, hi] = bottomInterval(domain, top, range);
                const sourceBottom = Math.floor((operation === 'addition' ? cap - top : top) / 10 ** (scale - bottomScale));
                if (all) {
                    allMass += Math.max(0, hi - lo + 1) / (sourceBottom + 1);
                    all[top - first] = allMass;
                }
                if (nonzero) {
                    const count = operation === 'subtraction' ? nonzeroSubtractionCount(top, scale)
                        : nonzeroDigits(top) ? Math.max(0, nonzeroDecimalDigitsAtMost(hi)
                            - nonzeroDecimalDigitsAtMost(Math.max(lo, power) - 1)) : 0;
                    nonzeroMass += count / (sourceBottom + 1);
                    nonzero[top - first] = nonzeroMass;
                }
            }
            result.push(domain);
        }
    }
    regularCache.set(key, result);
    return result;
}

/** Largest existing raw-coefficient corpus, conditioned exactly on canonical
 * scalar/column bounds and the existing numerical-zero predicate. */
export function standardDecimalColumnCases(operation: Operation, range: CanonicalNumericRange, zero: boolean): readonly DecimalColumnCase[] {
    if (!range || range.min !== 0 || !STANDARD_DECIMAL_COLUMN_UPPERS.includes(range.max as never)
        || !zero && range.max === 10)
        throw new GeneratorValidationError('standard-algorithm-decimal-add-subtract', 'Select a feasible canonical column range and zero profile.');
    const expected = createCanonicalNumericRange(range.max);
    if (range.maximumAbove !== expected.maximumAbove || range.minimumBelow !== expected.minimumBelow)
        throw new GeneratorValidationError('standard-algorithm-decimal-add-subtract', 'Canonical range witnesses must agree with the selected bounds.');
    const key = `${operation}:${range.max}:${zero}`, old = cache.get(key);
    if (old) return old;
    const result: DecimalColumnCase[] = [];
    for (const domain of regularDomains(operation, range)) {
        const weight = acceptedPrefix(domain, domain.last, zero) * domain.prior;
        if (weight > 0) result.push({...domain, weight});
    }
    if (zero) {
        const within = (value: number) => value > range.maximumAbove && value <= range.max;
        if (operation === 'addition') {
            for (const whole of [99, 999]) if (within(whole + 1)) for (let fractional = 991; fractional <= 999; fractional++)
                result.push({kind: 'pair', pair: {top: whole * 1000 + fractional, topScale: 3, bottom: 1000 - fractional, bottomScale: 3}, prior: 1 / 4 / 2 / 9, weight: 1 / 4 / 2 / 9});
            for (let whole = 10; whole <= 1000; whole++) {
                const first = Math.max(0, range.maximumAbove * 1000 + 1 - whole * 1000);
                const last = Math.min(whole === 1000 ? 0 : 999, range.max * 1000 - whole * 1000);
                if (first <= last) {
                    const prior = 1 / 4 / 991 / (whole === 1000 ? 1 : 1000);
                    result.push({kind: 'zero-addend', whole, first, last, prior, weight: (last - first + 1) * prior});
                }
            }
        } else {
            const first = Math.max(1, Math.floor((range.maximumAbove - 0.005) / 10) + 1);
            const last = Math.min(99, Math.floor((range.max - 0.005) / 10));
            if (first <= last) result.push({kind: 'borrow', first, last, prior: 1 / 4 / 99, weight: (last - first + 1) / 4 / 99});
            const firstEqual = Math.max(10, range.maximumAbove + 1), lastEqual = Math.min(1000, range.max);
            if (firstEqual <= lastEqual) result.push({kind: 'equal', first: firstEqual, last: lastEqual, prior: 1 / 4 / 991, weight: (lastEqual - firstEqual + 1) / 4 / 991});
        }
    }
    cache.set(key, result);
    return result;
}

const selectRank = (first: number, last: number, rank: number, cumulative: (n: number) => number): number => {
    while (first < last) {
        const middle = Math.floor((first + last) / 2);
        if (cumulative(middle) > rank) last = middle;
        else first = middle + 1;
    }
    return first;
};

export function sampleDecimalColumnPair(domain: DecimalColumnCase, range: CanonicalNumericRange, zero: boolean, draw: () => number): DecimalColumnPair {
    const integer = (first: number, last: number) => first + Math.floor(draw() * (last - first + 1));
    if (domain.kind === 'pair') return domain.pair;
    if (domain.kind === 'borrow') return {top: integer(domain.first, domain.last) * 10000 + 5, topScale: 3, bottom: integer(17, 95), bottomScale: 3};
    if (domain.kind === 'equal') {
        const whole = integer(domain.first, domain.last);
        return {top: whole * 1000, topScale: 3, bottom: whole * 100, bottomScale: 2};
    }
    if (domain.kind === 'zero-addend') return {top: domain.whole * 1000 + integer(domain.first, domain.last), topScale: 3, bottom: 0, bottomScale: integer(0, 3)};
    const mass = acceptedPrefix(domain, domain.last, zero);
    const top = selectRank(domain.first, domain.last, draw() * mass, n => acceptedPrefix(domain, n, zero));
    const [lo, hi] = bottomInterval(domain, top, range);
    const nonzeroAt = (n: number) => domain.bottomScale !== domain.scale ? 0
        : domain.operation === 'subtraction' ? nonzeroSubtractionAtMost(top, domain.scale, n)
            : nonzeroDigits(top) ? Math.max(0, nonzeroDecimalDigitsAtMost(n)
                - nonzeroDecimalDigitsAtMost(Math.max(lo, 10 ** domain.scale) - 1)) : 0;
    const count = zero ? hi - lo + 1 - nonzeroAt(hi) : nonzeroAt(hi);
    const rank = integer(0, count - 1);
    const bottom = selectRank(lo, hi, rank, n => zero ? n - lo + 1 - nonzeroAt(n) : nonzeroAt(n));
    return {top, topScale: domain.scale, bottom, bottomScale: domain.bottomScale};
}
