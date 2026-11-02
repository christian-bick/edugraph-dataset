import {createCanonicalNumericRange, type CanonicalNumericRange} from '../../../lib/canonical-numeric-range.ts';
import {GeneratorValidationError} from '../../../lib/errors.ts';
import type {StandardDivisionProblem} from '../../../types/problems.ts';

const generatorId = 'standard-algorithm-division';
const ceiling = 99999;
const uniformDividends = ceiling - 9;
const uppers = [5, 10, 20, 100, 120, 1000, 10000, 100000] as const;
const curatedQuotients = [10, 20, 30, 100, 101, 102, 200, 201, 1000, 1001, 1010];
const fieldsPerRow = 6;

export interface StandardDivisionDomain {
    /** Packed divisor, quotient, first remainder, last remainder, point weight, cumulative mass. */
    readonly rows: Float64Array;
    readonly count: number;
    readonly weight: number;
}
export interface StandardDivisionDomainRow {
    readonly divisor: number;
    readonly quotient: number;
    readonly firstRemainder: number;
    readonly lastRemainder: number;
    readonly pointWeight: number;
    readonly end: number;
}
interface ProfileStats {rows: number; count: number; weight: number}
interface SourceControls {pairs: number; originalMixtureMass: number; uniformMass: number}
interface SourceStats {profiles: ProfileStats[]; controls: SourceControls}
type Visit = (profile: number, divisor: number, quotient: number, first: number, last: number, pointWeight: number) => void;
const empty: StandardDivisionDomain = {rows: new Float64Array(), count: 0, weight: 0};
const statistics = new Map<number, SourceStats>();
const corpora = new Map<number, readonly StandardDivisionDomain[]>();

/** Only instructed arithmetic counts: quotient digits multiply the divisor; bring-down glyphs do not. */
export const standardDivisionQuantities = (data: StandardDivisionProblem): number[] => [
    data.dividend, data.divisor, data.quotient, data.remainder,
    ...data.steps.flatMap(step => [step.partialDividend, step.quotientDigit, step.product, step.remainder])
];

/** Earlier remainders follow backwards from the next quotient digit and remainder. */
function smallDivisorMinimum(divisor: number, quotient: number, remainder: number): number {
    let minimum = Math.min(divisor, remainder), previous = remainder;
    while (quotient > 0) {
        const digit = quotient % 10;
        minimum = Math.min(minimum, digit);
        quotient = Math.floor(quotient / 10);
        if (quotient > 0) {
            previous = Math.floor((divisor * digit + previous) / 10);
            minimum = Math.min(minimum, previous);
        }
    }
    return minimum;
}

/** Enumerates compact quotient/remainder intervals, never the 99,890,010 individual payloads. */
function visitSource(divisorDigits: number, visit: Visit): SourceControls {
    const firstDivisor = 10 ** (divisorDigits - 1), lastDivisor = 10 ** divisorDigits - 1;
    const divisorCount = lastDivisor - firstDivisor + 1;
    const uniformDensity = 1 / (divisorCount * uniformDividends);
    const controls: SourceControls = {pairs: 0, originalMixtureMass: 0, uniformMass: 0};
    for (let divisor = firstDivisor; divisor <= lastDivisor; divisor++) {
        const curated = new Set(curatedQuotients.filter(quotient => divisor * quotient <= ceiling));
        const exactCount = Math.floor(ceiling / divisor) - Math.ceil(10 / divisor) + 1;
        const emit = (quotient: number, first: number, last: number, zero: boolean, lower: number): void => {
            if (first > last) return;
            // Exact paths have additional mass at r=0; all positive remainders share one density.
            if (first === 0 && last > 0) {
                emit(quotient, 0, 0, zero, lower);
                emit(quotient, 1, last, zero, lower);
                return;
            }
            let mixtureDensity = (divisor <= 10 ? 0.5 : 0.25) * uniformDensity;
            if (quotient === 0) mixtureDensity += 0.25 / (divisorCount * (divisor - 10));
            if (curated.has(quotient)) mixtureDensity += 0.25 / (divisorCount * curated.size
                * (Math.min(divisor - 1, ceiling - divisor * quotient) + 1));
            if (first === 0 && last === 0) mixtureDensity += 0.25 / (divisorCount * exactCount);
            const count = last - first + 1;
            controls.pairs += count;
            controls.originalMixtureMass += count * mixtureDensity;
            controls.uniformMass += count * uniformDensity;
            const pointWeight = zero ? mixtureDensity : uniformDensity;
            const state = zero ? 0 : lower === 0 ? 1 : 2;
            if (quotient === 0) {
                visit(uppers.findIndex(upper => divisor <= upper) * 3 + state, divisor, quotient, first, last, pointWeight);
                return;
            }
            const base = divisor * quotient;
            const firstBand = uppers.findIndex(upper => base + first <= upper);
            const lastBand = uppers.findIndex(upper => base + last <= upper);
            for (let band = firstBand; band <= lastBand; band++) {
                const low = Math.max(first, (uppers[band - 1] ?? -1) - base + 1);
                const high = Math.min(last, uppers[band]! - base);
                if (low <= high) visit(band * 3 + state, divisor, quotient, low, high, pointWeight);
            }
        };
        for (let quotient = 0; quotient <= Math.floor(ceiling / divisor); quotient++) {
            const first = Math.max(0, 10 - divisor * quotient);
            const last = Math.min(divisor - 1, ceiling - divisor * quotient);
            if (first > last) continue;
            let remaining = quotient, zeroDigit = quotient === 0, allAtLeast5 = quotient > 0;
            while (remaining > 0) {
                const digit = remaining % 10;
                zeroDigit ||= digit === 0;
                allAtLeast5 &&= digit >= 5;
                remaining = Math.floor(remaining / 10);
            }
            if (zeroDigit) emit(quotient, first, last, true, 0);
            else if (divisor >= 10) {
                // Rprevious=floor((d*digit+Rnext)/10): digit>=1/Rnext>=1 keeps it positive;
                // digit>=5/Rnext>=5 keeps it >=5. The last remainder determines each interval.
                if (first === 0) emit(quotient, 0, 0, true, 0);
                const positive = Math.max(1, first);
                if (!allAtLeast5) emit(quotient, positive, last, false, 0);
                else {
                    emit(quotient, positive, Math.min(last, 4), false, 0);
                    emit(quotient, Math.max(positive, 5), last, false, 5);
                }
            } else {
                let start = first;
                let minimum = smallDivisorMinimum(divisor, quotient, first);
                let zero = minimum === 0, lower = minimum >= 5 ? 5 : 0;
                for (let remainder = first + 1; remainder <= last; remainder++) {
                    minimum = smallDivisorMinimum(divisor, quotient, remainder);
                    const nextZero = minimum === 0, nextLower = minimum >= 5 ? 5 : 0;
                    if (nextZero !== zero || nextLower !== lower) {
                        emit(quotient, start, remainder - 1, zero, lower);
                        start = remainder; zero = nextZero; lower = nextLower;
                    }
                }
                emit(quotient, start, last, zero, lower);
            }
        }
    }
    return controls;
}

function sourceStats(divisorDigits: number): SourceStats {
    if (!statistics.has(divisorDigits)) {
        const profiles = Array.from({length: uppers.length * 3}, (): ProfileStats => ({rows: 0, count: 0, weight: 0}));
        const controls = visitSource(divisorDigits, (index, _divisor, _quotient, first, last, pointWeight) => {
            const profile = profiles[index]!;
            profile.rows++; profile.count += last - first + 1; profile.weight += (last - first + 1) * pointWeight;
        });
        statistics.set(divisorDigits, {profiles, controls});
    }
    return statistics.get(divisorDigits)!;
}

function profileIndex(divisorDigits: number, zero: boolean, range: CanonicalNumericRange): number {
    if (![1, 2, 3].includes(divisorDigits) || typeof zero !== 'boolean' || !range
        || !(uppers as readonly number[]).includes(range.max) || ![0, 5].includes(range.min) || range.min >= range.max) {
        throw new GeneratorValidationError(generatorId, 'Expected a supported divisor width, zero profile and reviewed canonical bounds.');
    }
    const expected = createCanonicalNumericRange(range.max, range.min);
    if (range.maximumAbove !== expected.maximumAbove || range.minimumBelow !== expected.minimumBelow) {
        throw new GeneratorValidationError(generatorId, 'Canonical range witnesses are missing or inconsistent.');
    }
    return zero && range.min !== 0 ? -1 : uppers.findIndex(upper => range.max === upper) * 3 + (zero ? 0 : range.min === 0 ? 1 : 2);
}

export const standardDivisionProfileCount = (divisorDigits: number, zero: boolean, range: CanonicalNumericRange): number => {
    const index = profileIndex(divisorDigits, zero, range);
    return index < 0 ? 0 : sourceStats(divisorDigits).profiles[index]!.count;
};

/** Small metadata controls also prove the complete old mixture and mathematical envelope. */
export const standardDivisionSourceControls = (divisorDigits: 1 | 2 | 3): Readonly<SourceControls> => sourceStats(divisorDigits).controls;

export function standardDivisionDomain(divisorDigits: number, zero: boolean, range: CanonicalNumericRange): StandardDivisionDomain {
    const index = profileIndex(divisorDigits, zero, range);
    if (index < 0 || sourceStats(divisorDigits).profiles[index]!.count === 0) return empty;
    if (!corpora.has(divisorDigits)) {
        const stats = sourceStats(divisorDigits);
        const domains = stats.profiles.map(profile => ({rows: new Float64Array(profile.rows * fieldsPerRow),
            count: profile.count, weight: profile.weight}));
        const positions = new Uint32Array(domains.length), masses = new Float64Array(domains.length);
        visitSource(divisorDigits, (profile, divisor, quotient, first, last, pointWeight) => {
            const offset = positions[profile]!++ * fieldsPerRow, data = domains[profile]!.rows;
            masses[profile]! += (last - first + 1) * pointWeight;
            data[offset] = divisor; data[offset + 1] = quotient; data[offset + 2] = first;
            data[offset + 3] = last; data[offset + 4] = pointWeight; data[offset + 5] = masses[profile]!;
        });
        corpora.set(divisorDigits, domains);
    }
    return corpora.get(divisorDigits)![index]!;
}

export function standardDivisionDomainRow(domain: StandardDivisionDomain, index: number): StandardDivisionDomainRow {
    if (!Number.isSafeInteger(index) || index < 0 || index >= domain.rows.length / fieldsPerRow) {
        throw new GeneratorValidationError(generatorId, 'Expected an admitted weighted-domain row.');
    }
    const offset = index * fieldsPerRow, values = domain.rows;
    return {divisor: values[offset]!, quotient: values[offset + 1]!, firstRemainder: values[offset + 2]!,
        lastRemainder: values[offset + 3]!, pointWeight: values[offset + 4]!, end: values[offset + 5]!};
}

export function standardDivisionFrame(domain: StandardDivisionDomain, position: number): {dividend: number; divisor: number} {
    if (!Number.isFinite(position) || position < 0 || position >= domain.weight) {
        throw new GeneratorValidationError(generatorId, 'Expected an admitted weighted-domain position.');
    }
    let low = 0, high = domain.rows.length / fieldsPerRow - 1;
    while (low < high) {
        const middle = (low + high) >>> 1;
        if (position < domain.rows[middle * fieldsPerRow + 5]!) high = middle;
        else low = middle + 1;
    }
    const row = standardDivisionDomainRow(domain, low), count = row.lastRemainder - row.firstRemainder + 1;
    const remainder = row.firstRemainder + Math.max(0, Math.min(count - 1,
        Math.floor((position - (row.end - count * row.pointWeight)) / row.pointWeight)));
    return {dividend: row.divisor * row.quotient + remainder, divisor: row.divisor};
}
