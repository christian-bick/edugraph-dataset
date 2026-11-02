import {Area, Scope, deductCompatible} from 'edugraph-ts';
import {CANONICAL_RANGE_THRESHOLDS, createCanonicalNumericRange, type CanonicalNumericRange} from '../../lib/canonical-numeric-range.ts';
import {GeneratorValidationError} from '../../lib/errors.ts';
import {resolveRangeFromLabels} from '../../lib/ontology.ts';
import {registerStaticResolver} from '../../lib/static-resolvers.ts';
import {selectExactMatch} from '../../lib/resolvers.ts';
import {compositionalResolver, exactResolver, withLabelChoices} from '../../types/schema.ts';
import {resolveWritingZero} from './zero-profile.ts';

export const writingRangeLabels: readonly string[] = deductCompatible([Scope.NumbersLargerZero, Scope.NumbersSmaller1000000]);
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
        && resolveRangeFromLabels(labels).max !== 5) return undefined;
    return notation;
}), {kind: 'alternatives', alternatives: writingNotationLabels.map(label => [label]),
    contextLabels: [...writingRangeLabels, Scope.NumbersWithZero, Scope.NumbersWithoutZero]}));

/** Non-name fields retain their old target-label binding exactly. Name cells
 * are finite scalar bands; no quantity depends on a generated glyph or image. */
export const resolveWritingRange = registerStaticResolver(withLabelChoices(compositionalResolver((labels: string[]) => {
    if (!labels.includes(Area.NumberNameNotation)) return resolveRangeFromLabels(labels);
    const range = nameRangeForLabels(labels);
    return labels.includes(Scope.NumbersWithZero) && range?.max !== 5 ? undefined : range;
}), {
    kind: 'alternatives', relation: 'capability', alternatives: legacyWritingRanges,
    contextLabels: [Area.DigitNotation, Area.NumerationWithIntegers, Area.NumberNameNotation,
        Scope.NumbersWithZero, Scope.NumbersWithoutZero], resolvedContext: true
}));

/** Only the name competency gets the matching-capable positive scalar default.
 * All old zero and non-name default rules, and explicit zero requests, remain. */
export const resolveNameAwareWritingZero = registerStaticResolver(withLabelChoices(compositionalResolver((labels: string[]) =>
    labels.includes(Area.NumberNameNotation) && !labels.includes(Scope.NumbersWithZero) && !labels.includes(Scope.NumbersWithoutZero)
        ? false : resolveWritingZero(labels)), {...resolveWritingZero.labelChoices!, kind: 'alternatives',
    contextLabels: [...resolveWritingZero.labelChoices!.contextLabels!, Area.NumberNameNotation], resolvedContext: true,
    defaults: [{whenAll: [Area.NumberNameNotation], labels: [Scope.NumbersWithoutZero]},
        ...(resolveWritingZero.labelChoices!.kind === 'alternatives' ? resolveWritingZero.labelChoices!.defaults ?? [] : [])]
}));

export function nameIntegerInterval(range: Partial<CanonicalNumericRange> & {min: number; max: number}, zero: boolean): readonly [number, number] {
    const profile = nameRangeProfiles.find(p => p.range.max === range.max && p.range.min === range.min);
    const full = range as CanonicalNumericRange;
    if (!profile || full.maximumAbove !== profile.range.maximumAbove || full.minimumBelow !== profile.range.minimumBelow
        || zero && range.max !== 5)
        throw new GeneratorValidationError('writing', 'Number names require a feasible canonical scalar range.');
    return zero ? [0, 0] : [Math.max(1, profile.range.maximumAbove + 1), profile.range.max - 1];
}
