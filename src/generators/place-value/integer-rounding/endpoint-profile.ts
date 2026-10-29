import {Scope} from 'edugraph-ts';
import {resolveRangeFromLabels} from '../../../lib/ontology.ts';
import {exactResolver, withLabelChoices} from '../../../types/schema.ts';

export const roundingPlaces = [
    [Scope.StepsOf10, 10], [Scope.StepsOf100, 100], [Scope.StepsOf1000, 1000],
    [Scope.StepsOf10000, 10000], [Scope.StepsOf100000, 100000]
] as const;
export const midpointClearanceRatio = 0.05;
const rangeLabels = resolveRangeFromLabels.labelChoices!.contextLabels!;
export const endpointContext = [...rangeLabels, ...roundingPlaces.map(([label]) => label)];
type Range = {readonly min: number; readonly max: number};

/** Exact endpoint support of the existing two rounding branches, without drawing a number. */
export function hasEndpointProfile(range: Range, place: number, zero: boolean): boolean {
    const high = range.max > 1000 || place > 100;
    const minimum = Math.max(high ? 1000 : 0, Math.ceil(range.min));
    const maximum = Math.min(high ? 1_000_000 : 1000, Math.floor(range.max));
    if (minimum > maximum) return false;
    const first = high ? Math.floor(minimum / place)
        : Math.ceil(Math.max(0, minimum - place + 1) / place);
    const last = high ? Math.floor((maximum - 1) / place)
        : Math.floor((maximum - place - 1) / place);
    if (first > last) return false;
    const supportsIndex = (index: number): boolean => {
        if (index < first || index > last) return false;
        if (!high) return true;
        const low = Math.max(minimum, index * place + 1);
        const upper = Math.min(maximum, (index + 1) * place - 1);
        if (low > upper) return false;
        const midpoint = index * place + place / 2;
        const clearance = Math.ceil(place * midpointClearanceRatio);
        return low <= midpoint && midpoint <= upper
            || low <= Math.min(upper, midpoint - clearance)
            || Math.max(low, midpoint + clearance) <= upper;
    };
    if (zero) return supportsIndex(0);
    const positiveFirst = Math.max(1, first);
    if (positiveFirst > last) return false;
    // An interior index has a complete interval and therefore supported numbers.
    return last - positiveFirst >= 2 || supportsIndex(positiveFirst) || supportsIndex(last);
}

export const resolveZeroEndpoint = withLabelChoices(exactResolver((labels: string[]): boolean | undefined => {
    const zero = labels.includes(Scope.NumbersWithZero);
    const positive = labels.includes(Scope.NumbersWithoutZero);
    if (zero && positive) return undefined;
    const magnitudes = roundingPlaces.filter(([label]) => labels.includes(label));
    if (magnitudes.length > 1) return undefined;
    // Authored standalone fallbacks describe a valid zero profile. During direct
    // resolution the preceding magnitude field supplies its actual selected context.
    if (!magnitudes.length) return zero ? true : positive ? false : undefined;
    const place = magnitudes[0]![1];
    const range = resolveRangeFromLabels(labels);
    // Explicit profiles remain type-resolvable; matching and the generator guard
    // enforce numeric availability. An impossible legacy direct magnitude therefore
    // still generates null instead of failing configuration extraction.
    if (zero || positive) return zero;
    const canZero = hasEndpointProfile(range, place, true);
    const canPositive = hasEndpointProfile(range, place, false);
    return canZero === canPositive ? canZero ? undefined : false : canZero;
}), {kind: 'alternatives', alternatives: [[Scope.NumbersWithZero], [Scope.NumbersWithoutZero]],
    contextLabels: endpointContext, resolvedContext: true});
