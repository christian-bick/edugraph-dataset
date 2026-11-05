import {createCanonicalNumericRange, type CanonicalNumericRange} from '../../../lib/canonical-numeric-range.ts';
import {GeneratorValidationError} from '../../../lib/errors.ts';
import {random} from '../../../lib/random.ts';

export const STANDARD_MULTIPLICATION_UPPERS = [1000, 10000, 100000, 1000000] as const;
/** False is the native product domain above the ontology's largest upper threshold. */
export type StandardMultiplicationRange = CanonicalNumericRange | false;

export interface StandardMultiplicationRow {
    readonly multiplicand: number;
    readonly count: number;
    readonly multiplierWeight: number;
    readonly weight: number;
    readonly cumulativeWeight: number;
}
export interface StandardMultiplicationDomain {
    readonly rows: readonly StandardMultiplicationRow[];
    readonly count: number;
    readonly weight: number;
}
const cache = new Map<number | false, StandardMultiplicationDomain>();

function rangeKey(range: StandardMultiplicationRange): number | false {
    if (range === false) return false;
    if (range && range.min === 0 && STANDARD_MULTIPLICATION_UPPERS.some(upper => upper === range.max)) {
        const expected = createCanonicalNumericRange(range.max);
        if (range.maximumAbove === expected.maximumAbove && range.minimumBelow === expected.minimumBelow) return range.max;
    }
    throw new GeneratorValidationError('standard-algorithm-multiplication',
        'Select a supported canonical range or the unlabelled overflow profile.');
}

const maximumDigit = (value: number): number => {
    let maximum = 0;
    for (let remaining = value; remaining > 0; remaining = Math.floor(remaining / 10))
        maximum = Math.max(maximum, remaining % 10);
    return maximum;
};

/** A carry must first arise from an uncarried column total of at least ten. */
function hasBothCarries(multiplicand: number, multiplier: number, largestDigit = maximumDigit(multiplicand)): boolean {
    const traits = nativeMultiplierTraits[multiplier - 10]!;
    const {ones, tens, hundreds} = traits;
    if (largestDigit * traits.maximumDigit < 10) return false;
    let first = multiplicand * ones;
    let second = multiplicand * tens * 10;
    let third = multiplicand * hundreds * 100;
    while (first > 0 || second > 0 || third > 0) {
        if (first % 10 + second % 10 + third % 10 >= 10) return true;
        first = Math.floor(first / 10);
        second = Math.floor(second / 10);
        third = Math.floor(third / 10);
    }
    return false;
}

/** Integer weights retain the general scenarios and the overlapping a0b/ab0 scenarios. */
export function standardMultiplicationMultiplierWeight(multiplier: number): number {
    if (!Number.isSafeInteger(multiplier) || multiplier < 10 || multiplier > 999) return 0;
    if (multiplier < 100) return 90;
    const tens = Math.floor(multiplier / 10) % 10;
    const ones = multiplier % 10;
    return 9 + (tens === 0 && ones > 0 || tens > 0 && ones === 0 ? 100 : 0);
}

/** Fixed native digit/weight data avoids decoding the same multiplier for every multiplicand. */
const nativeMultiplierTraits = Array.from({length: 990}, (_, index) => {
    const multiplier = index + 10;
    const ones = multiplier % 10;
    const tens = Math.floor(multiplier / 10) % 10;
    const hundreds = Math.floor(multiplier / 100);
    return {ones, tens, hundreds, maximumDigit: Math.max(ones, tens, hundreds),
        weight: standardMultiplicationMultiplierWeight(multiplier)};
});

/** Native proposal probability is this weight / 874,800,000 before carry conditioning. */
export function standardMultiplicationPairWeight(multiplicand: number, multiplier: number): number {
    if (!Number.isSafeInteger(multiplicand) || multiplicand < 10 || multiplicand > 9999
        || !Number.isSafeInteger(multiplier) || multiplier < 10 || multiplier > 999
        || !hasBothCarries(multiplicand, multiplier)) return 0;
    return (multiplicand < 100 ? 100 : multiplicand < 1000 ? 10 : 1)
        * standardMultiplicationMultiplierWeight(multiplier);
}

function visitMultipliers(multiplicand: number, key: number | false,
    visit?: (multiplier: number, weight: number) => void): {count: number; weight: number} {
    const upperIndex = STANDARD_MULTIPLICATION_UPPERS.findIndex(upper => upper === key);
    const minimumProduct = key === false ? 1000001 : upperIndex === 0 ? 121 : STANDARD_MULTIPLICATION_UPPERS[upperIndex - 1]! + 1;
    const maximumProduct = key === false ? 9989001 : key;
    const minimum = Math.max(10, Math.ceil(minimumProduct / multiplicand));
    const maximum = Math.min(999, Math.floor(maximumProduct / multiplicand));
    const largestDigit = maximumDigit(multiplicand);
    let count = 0;
    let weight = 0;
    for (let multiplier = minimum; multiplier <= maximum; multiplier++) {
        if (!hasBothCarries(multiplicand, multiplier, largestDigit)) continue;
        const entryWeight = nativeMultiplierTraits[multiplier - 10]!.weight;
        count++;
        weight += entryWeight;
        visit?.(multiplier, entryWeight);
    }
    return {count, weight};
}

/** Lazily store row masses, rather than millions of full payloads or pair objects. */
export function standardMultiplicationDomain(range: StandardMultiplicationRange): StandardMultiplicationDomain {
    const key = rangeKey(range);
    const existing = cache.get(key);
    if (existing) return existing;
    const rows: StandardMultiplicationRow[] = [];
    let count = 0;
    let weight = 0;
    const maximum = key === false ? 9999 : Math.min(9999, Math.floor(key / 10));
    for (let multiplicand = 10; multiplicand <= maximum; multiplicand++) {
        const multipliers = visitMultipliers(multiplicand, key);
        if (!multipliers.count) continue;
        const rowWeight = multipliers.weight * (multiplicand < 100 ? 100 : multiplicand < 1000 ? 10 : 1);
        count += multipliers.count;
        weight += rowWeight;
        rows.push({multiplicand, count: multipliers.count, multiplierWeight: multipliers.weight,
            weight: rowWeight, cumulativeWeight: weight});
    }
    const domain = {rows, count, weight};
    cache.set(key, domain);
    return domain;
}

/** Exposes one compact conditional row for exact support and weight verification. */
export function standardMultiplicationMultipliers(multiplicand: number, range: StandardMultiplicationRange): readonly {
    multiplier: number; weight: number;
}[] {
    const key = rangeKey(range);
    if (!Number.isSafeInteger(multiplicand) || multiplicand < 10 || multiplicand > 9999)
        throw new GeneratorValidationError('standard-algorithm-multiplication', 'Select a native 2–4-digit multiplicand.');
    const entries: {multiplier: number; weight: number}[] = [];
    visitMultipliers(multiplicand, key, (multiplier, weight) => entries.push({multiplier, weight}));
    return entries;
}

/** Two inverse draws exactly condition the original proposal law on carries and the selected cell. */
export function sampleStandardMultiplicationFactors(range: StandardMultiplicationRange): readonly [number, number] {
    const domain = standardMultiplicationDomain(range);
    const ticket = random() * domain.weight;
    let low = 0;
    let high = domain.rows.length - 1;
    while (low < high) {
        const middle = Math.floor((low + high) / 2);
        if (ticket < domain.rows[middle]!.cumulativeWeight) high = middle;
        else low = middle + 1;
    }
    const row = domain.rows[low]!;
    const multipliers = standardMultiplicationMultipliers(row.multiplicand, range);
    let remaining = random() * row.multiplierWeight;
    const selected = multipliers.find(entry => (remaining -= entry.weight) < 0) ?? multipliers[multipliers.length - 1]!;
    return [row.multiplicand, selected.multiplier];
}
