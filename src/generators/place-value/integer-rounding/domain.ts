import {createCanonicalNumericRange, type CanonicalNumericRange} from '../../../lib/canonical-numeric-range.ts';
import {GeneratorValidationError} from '../../../lib/errors.ts';
import type {IntegerRoundingProblem} from '../../../types/problems.ts';
import {midpointClearanceRatio} from './endpoint-profile.ts';

type Interval = readonly [number, number];
export interface RoundingRow {readonly firstIndex: number; readonly lastIndex: number;
    readonly firstOffset: number; readonly lastOffset: number; readonly pointWeight: number; readonly end: number}
export interface RoundingDomain {readonly rows: readonly RoundingRow[]; readonly count: number;
    readonly weight: number; readonly place: number; readonly multiDigit: boolean}
const cache = new Map<string, RoundingDomain>();
const error = (message: string) => new GeneratorValidationError('integer-rounding', message);

export const integerRoundingQuantities = (data: IntegerRoundingProblem): number[] => [data.number,
    data.lowerMultiple, data.midpoint, data.upperMultiple, data.roundedValue, data.distanceLower, data.distanceUpper];

/** Build the same required endpoint/distance calculation independently of annotation selection. */
export function buildIntegerRoundingProblem(number: number, place: number, multiDigit: boolean): IntegerRoundingProblem {
    if (!Number.isSafeInteger(number) || ![10, 100, 1000, 10000, 100000].includes(place)
        || number < 1 || number >= 1000000 || number % place === 0
        || multiDigit && number < 1000 || !multiDigit && (number > 1000 || place > 100)) throw error('Expected a valid rounding source and place.');
    const lowerMultiple = Math.floor(number / place) * place, upperMultiple = lowerMultiple + place;
    const midpoint = lowerMultiple + place / 2;
    const direction = number < midpoint ? 'down' : 'up';
    const values = {number, roundingPlace: place, lowerMultiple, midpoint, upperMultiple,
        roundedValue: direction === 'down' ? lowerMultiple : upperMultiple, direction,
        distanceLower: number - lowerMultiple, distanceUpper: upperMultiple - number, isMidpointTie: number === midpoint};
    return (multiDigit ? {...values, task: 'multi-digit-integer-rounding'} : values) as IntegerRoundingProblem;
}

function merge(intervals: Interval[]): Interval[] {
    const result: Interval[] = [];
    for (const [low, high] of intervals.filter(([low, high]) => low <= high).sort((a, b) => a[0] - b[0])) {
        const previous = result.at(-1);
        if (previous && low <= previous[1] + 1) result[result.length - 1] = [previous[0], Math.max(previous[1], high)];
        else result.push([low, high]);
    }
    return result;
}

/** Index and offset intervals partition the complete old source corpora, before any random draw. */
export function roundingDomain(place: number, zero: boolean, range: CanonicalNumericRange): RoundingDomain {
    if (![10, 100, 1000, 10000, 100000].includes(place) || typeof zero !== 'boolean' || !range) throw error('Expected a reviewed place, endpoint profile and canonical bounds.');
    let expected: CanonicalNumericRange;
    try {expected = createCanonicalNumericRange(range.max, range.min);} catch {throw error('Expected canonical numeric bounds.');}
    if (range.maximumAbove !== expected.maximumAbove || range.minimumBelow !== expected.minimumBelow) throw error('Canonical range witnesses are missing or inconsistent.');
    const key = `${place}:${zero}:${range.min}:${range.max}`;
    if (cache.has(key)) return cache.get(key)!;
    const multiDigit = range.max > 1000 || place > 100;
    const firstNativeIndex = multiDigit ? Math.floor(1000 / place) : 0;
    const lastNativeIndex = multiDigit ? Math.floor(999999 / place) : Math.floor((1000 - place - 1) / place);
    const firstProfileIndex = zero ? 0 : Math.max(1, firstNativeIndex);
    const lastProfileIndex = zero ? 0 : lastNativeIndex;
    const nativeIndexCount = lastProfileIndex - firstProfileIndex + 1;
    const firstIndex = Math.max(firstNativeIndex, firstProfileIndex, Math.ceil((range.maximumAbove + 1) / place) - 1);
    const lastIndex = Math.min(lastNativeIndex, lastProfileIndex, Math.floor(range.max / place) - 1);
    const rows: RoundingRow[] = [];
    let count = 0, weight = 0;
    if (firstIndex <= lastIndex && (!zero || range.min === 0)) {
        const minimumOffset = multiDigit && zero ? Math.max(1, 1000) : 1;
        const midpoint = place / 2, clearance = Math.ceil(place * midpointClearanceRatio);
        const lower = Math.max(minimumOffset, range.min), upper = Math.min(place - 1, place - range.min);
        const canonical = zero ? [[lower, upper] as Interval] : merge([
            [lower, Math.min(upper, range.minimumBelow - 1)],
            [Math.max(lower, place - range.minimumBelow + 1), upper]
        ]);
        const nonTies = multiDigit ? [[minimumOffset, Math.min(place - 1, midpoint - clearance)],
            [Math.max(minimumOffset, midpoint + clearance), place - 1]] as Interval[] : [[minimumOffset, place - 1] as Interval];
        const nonTieCount = nonTies.reduce((sum, [low, high]) => sum + Math.max(0, high - low + 1), 0);
        const sources = multiDigit ? [...nonTies.map(([low, high]) => ({low, high, mass: 0.8 / nonTieCount})),
            {low: midpoint, high: midpoint, mass: 0.2}] : [{low: minimumOffset, high: place - 1, mass: 1 / (place - 1)}];
        for (const source of sources) for (const interval of canonical) {
            const firstOffset = Math.max(source.low, interval[0]), lastOffset = Math.min(source.high, interval[1]);
            if (firstOffset > lastOffset || firstOffset < minimumOffset) continue;
            const size = (lastIndex - firstIndex + 1) * (lastOffset - firstOffset + 1);
            const pointWeight = source.mass / nativeIndexCount;
            count += size; weight += size * pointWeight;
            rows.push({firstIndex, lastIndex, firstOffset, lastOffset, pointWeight, end: weight});
        }
    }
    const domain = {rows, count, weight, place, multiDigit};
    cache.set(key, domain);
    return domain;
}

export function roundingFrame(domain: RoundingDomain, position: number): IntegerRoundingProblem {
    if (!Number.isFinite(position) || position < 0 || position >= domain.weight) throw error('Expected an admitted weighted rounding position.');
    const row = domain.rows.find(row => position < row.end)!;
    const offsets = row.lastOffset - row.firstOffset + 1, count = (row.lastIndex - row.firstIndex + 1) * offsets;
    const index = Math.max(0, Math.min(count - 1, Math.floor((position - (row.end - count * row.pointWeight)) / row.pointWeight)));
    const multiple = row.firstIndex + Math.floor(index / offsets), offset = row.firstOffset + index % offsets;
    return buildIntegerRoundingProblem(multiple * domain.place + offset, domain.place, domain.multiDigit);
}
