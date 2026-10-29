import {Scope} from 'edugraph-ts';
import {resolveRangeFromLabels} from '../../lib/ontology.ts';
import {registerStaticResolver} from '../../lib/static-resolvers.ts';
import {exactResolver, withLabelChoices} from '../../types/schema.ts';

export type WritingZeroProfile = boolean | 'coefficient-zero' | 'coefficient-nonzero';
export const writingRangeLabels = resolveRangeFromLabels.labelChoices!.contextLabels!;
export const writingZeroContext = [...writingRangeLabels, Scope.Numberline];
const finiteCoefficientBounds = writingRangeLabels.filter(label => {
    const {max} = resolveRangeFromLabels([label]);
    return max > 1000 && max <= 1_000_000;
});

/** Positive values through 1000 use the old scalar contract; larger values expose each coefficient. */
export const hasWritingZero = (value: number): boolean => value === 0 || value > 1000 && String(value).includes('0');

function countNonzeroDigits(maximum: number): number {
    if (maximum < 1) return 0;
    const digits = String(maximum).split('').map(Number);
    let count = 0;
    for (let length = 1; length < digits.length; length++) count += 9 ** length;
    for (let index = 0; index < digits.length; index++) {
        const digit = digits[index]!;
        count += Math.max(0, digit - 1) * 9 ** (digits.length - index - 1);
        if (digit === 0) return count;
    }
    return count + 1;
}

const absenceThrough = (maximum: number): number => {
    if (maximum < 1) return 0;
    if (maximum <= 1000) return maximum;
    return 1000 + countNonzeroDigits(maximum) - countNonzeroDigits(1000);
};

/** Counts the old uniform positive domain exactly, without constructing a million-element pool. */
export function writingProfileCount(minimum: number, maximum: number, zero: boolean): number {
    const lower = Math.max(1, Math.ceil(minimum));
    const upper = Math.floor(maximum);
    const scalarZero = zero && minimum <= 0 && maximum >= 0 ? 1 : 0;
    if (upper < lower) return scalarZero;
    const absent = absenceThrough(upper) - absenceThrough(lower - 1);
    return zero ? upper - lower + 1 - absent + scalarZero : absent;
}

/** Invert the exact cumulative count; each old eligible integer has the same conditional mass. */
export function writingProfileValue(minimum: number, maximum: number, zero: boolean, rank: number): number | null {
    const total = writingProfileCount(minimum, maximum, zero);
    if (!Number.isInteger(rank) || rank < 0 || rank >= total) return null;
    let lower = Math.max(zero ? 0 : 1, Math.ceil(minimum));
    let upper = Math.floor(maximum);
    while (lower < upper) {
        const middle = Math.floor((lower + upper) / 2);
        if (writingProfileCount(minimum, middle, zero) > rank) upper = middle;
        else lower = middle + 1;
    }
    return lower;
}

// Reviewed exact owner identity: every admitted binding is a pure finite range/profile
// lookup. Counting and resolution consume no entropy, payload, time or graph information.
export const resolveWritingZero = registerStaticResolver(withLabelChoices(exactResolver(
    (labels: string[]): WritingZeroProfile | undefined => {
        const zero = labels.includes(Scope.NumbersWithZero);
        const absence = labels.includes(Scope.NumbersWithoutZero);
        if (zero && absence) return undefined;
        if (absence && labels.includes(Scope.Numberline)) return undefined;
        const range = resolveRangeFromLabels(labels.filter(label => writingRangeLabels.includes(label)));
        const coefficientDomain = range.max > 1000 && range.max <= 1_000_000;
        if (!coefficientDomain) return zero && (range.min > 0 || range.max < 0) ? undefined : zero;
        if (!zero && !absence) return undefined;
        if (!writingProfileCount(range.min, range.max, zero)) return undefined;
        return zero ? 'coefficient-zero' : 'coefficient-nonzero';
    }
), {
    kind: 'alternatives', alternatives: [[], [Scope.NumbersWithZero], [Scope.NumbersWithoutZero]],
    contextLabels: writingZeroContext,
    defaults: [
        {whenNone: finiteCoefficientBounds, labels: []}
    ]
}));
