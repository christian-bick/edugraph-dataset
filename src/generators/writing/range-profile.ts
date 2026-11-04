import {Area, Scope} from 'edugraph-ts';
import {CANONICAL_RANGE_THRESHOLDS, createCanonicalNumericRange, type CanonicalNumericRange} from '../../lib/canonical-numeric-range.ts';
import {GeneratorValidationError} from '../../lib/errors.ts';
import {resolveRangeFromLabels} from '../../lib/ontology.ts';
import {registerStaticResolver} from '../../lib/static-resolvers.ts';
import {selectExactMatch} from '../../lib/resolvers.ts';
import {compositionalResolver, exactResolver, withLabelChoices} from '../../types/schema.ts';
import {resolveWritingZero} from './zero-profile.ts';

// Preserve the former declared inventory/order. Compatibility inspects these
// exact alternatives; capability deduction must not define its boundaries.
export const writingRangeLabels: readonly string[] = [
    Scope.NumbersLarger10, Scope.NumbersLarger100, Scope.NumbersLarger1000,
    Scope.NumbersLarger10000, Scope.NumbersLarger100000, Scope.NumbersLarger120,
    Scope.NumbersLarger20, Scope.NumbersLarger5, Scope.NumbersLargerZero,
    Scope.NumbersSmaller10, Scope.NumbersSmaller100, Scope.NumbersSmaller1000,
    Scope.NumbersSmaller10000, Scope.NumbersSmaller100000, Scope.NumbersSmaller1000000,
    Scope.NumbersSmaller120, Scope.NumbersSmaller20, Scope.NumbersSmaller5
];
const upperLabels = writingRangeLabels.filter(label => label.includes('/NumbersSmaller'));
const lowerLabels = writingRangeLabels.filter(label => label.includes('/NumbersLarger'));
export const legacyWritingRanges = [[], ...upperLabels.map(label => [label])].flatMap(upper =>
    [upper, ...lowerLabels.map(lower => [...upper, lower])])
    .map(labels => [...labels].sort((a, b) => writingRangeLabels.indexOf(a) - writingRangeLabels.indexOf(b)));
// Keep explicitly authored universal floors legal on untouched legacy paths,
// but never add their redundant alias to a direct fallback or consume a draw.
export const writingRangeFallbacks = legacyWritingRanges.filter(labels => !labels.includes(Scope.NumbersLargerZero));
export const nameRangeProfiles = CANONICAL_RANGE_THRESHOLDS.map((upper, index) => ({
    labels: [`http://edugraph.io/edu/NumbersSmaller${upper}`,
        ...(index ? [`http://edugraph.io/edu/NumbersLarger${CANONICAL_RANGE_THRESHOLDS[index - 1]}`] : [])],
    range: createCanonicalNumericRange(upper, index ? CANONICAL_RANGE_THRESHOLDS[index - 1] : 0)
}));
export const nameRangeForLabels = (labels: readonly string[]) => {
    const bounds = resolveRangeFromLabels(labels.filter(label => writingRangeLabels.includes(label)));
    return nameRangeProfiles.find(profile => profile.range.max === bounds.max && profile.range.min === bounds.min)?.range;
};
export const writingNotationLabels = [Area.DigitNotation, Area.NumerationWithIntegers, Area.NumberNameNotation] as const;
export const resolveWritingNotation = registerStaticResolver(withLabelChoices(exactResolver((labels: string[]) => {
    const notation = selectExactMatch(labels, writingNotationLabels);
    if (notation === Area.NumberNameNotation && labels.includes(Scope.NumbersWithZero)
        && upperLabels.some(label => labels.includes(label)) && resolveRangeFromLabels(labels).max !== 5) return undefined;
    return notation;
}), {kind: 'alternatives', alternatives: writingNotationLabels.map(label => [label]),
    contextLabels: [...writingRangeLabels, Scope.NumbersWithZero, Scope.NumbersWithoutZero]}));

/** Positive values use scalar bands for every notation. Preserve the legacy
 * binding of explicit non-name zero; glyphs and place-value parts do not add quantities. */
export const resolveWritingRange = registerStaticResolver(withLabelChoices(compositionalResolver((labels: string[]) => {
    if (!writingNotationLabels.some(label => labels.includes(label))) return resolveRangeFromLabels(labels);
    if (!labels.includes(Area.NumberNameNotation) && labels.includes(Scope.NumbersWithZero)) return resolveRangeFromLabels(labels);
    const range = nameRangeForLabels(labels);
    return labels.includes(Scope.NumbersWithZero) && range?.max !== 5 ? undefined : range;
}), {
    kind: 'alternatives', relation: 'capability', alternatives: legacyWritingRanges,
    contextLabels: [Area.DigitNotation, Area.NumerationWithIntegers, Area.NumberNameNotation,
        Scope.NumbersWithZero, Scope.NumbersWithoutZero], resolvedContext: true
}));

/** Positive scalar absence is a matching-capable choice. Name defaults keep
 * their established priority; explicit zero and the legacy number-line boundary remain. */
export const resolveNameAwareWritingZero = registerStaticResolver(withLabelChoices(compositionalResolver((labels: string[]) =>
    labels.includes(Area.NumberNameNotation) && !labels.includes(Scope.NumbersWithZero) && !labels.includes(Scope.NumbersWithoutZero)
        ? false : resolveWritingZero(labels)), {...resolveWritingZero.labelChoices!, kind: 'alternatives',
    contextLabels: [...resolveWritingZero.labelChoices!.contextLabels!, Area.NumberNameNotation], resolvedContext: true,
    defaults: [{whenAll: [Area.NumberNameNotation], labels: [Scope.NumbersWithoutZero]},
        {whenNone: [Scope.Numberline], labels: [Scope.NumbersWithoutZero]},
        ...(resolveWritingZero.labelChoices!.kind === 'alternatives' ? resolveWritingZero.labelChoices!.defaults ?? [] : [])]
}));

export function nameIntegerInterval(range: Partial<CanonicalNumericRange> & {min: number; max: number}, zero: boolean): readonly [number, number] {
    const profile = nameRangeProfiles.find(p => p.range.max === range.max && p.range.min === range.min);
    const full = range as CanonicalNumericRange;
    if (!profile || full.maximumAbove !== profile.range.maximumAbove || full.minimumBelow !== profile.range.minimumBelow
        || zero && range.max !== 5)
        throw new GeneratorValidationError('writing', 'Writing requires a feasible canonical scalar range.');
    return zero ? [0, 0] : [Math.max(1, profile.range.maximumAbove + 1), profile.range.max - 1];
}
