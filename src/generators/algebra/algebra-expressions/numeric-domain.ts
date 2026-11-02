import {canonicalRangeProfiles} from '../../../lib/canonical-range-labels.ts';
import type {CanonicalNumericRange} from '../../../lib/canonical-numeric-range.ts';
import {makeSignedRational} from '../../number/signed-rational-helpers.ts';
import type {AlgebraNumericProfile, ExpressionInputs} from './numeric-profiles.ts';

type NumericFamily = 'terms' | 'pair' | 'grouped' | 'quotient';
const familyFor = (relation: string): NumericFamily | undefined => relation === 'numeric-terms' ? 'terms'
    : relation === 'numeric-sum' ? 'pair' : relation === 'numeric-quotient' ? 'quotient'
        : ['numeric-factors', 'numeric-product', 'numeric-grouped'].includes(relation) ? 'grouped' : undefined;
const candidates = canonicalRangeProfiles.filter(profile => profile.range.max <= 100);
const domainKey = (family: NumericFamily, profile: AlgebraNumericProfile, range: CanonicalNumericRange) =>
    `${family}:${profile}:${range.min}:${range.max}`;

/** Original five independent uniform draws, encoded before rational reduction. */
function rawInputsAt(index: number) {
    const denominator = index % 4 + 1;
    index = Math.floor(index / 4);
    const numerator = index % 17 - 8;
    index = Math.floor(index / 17);
    const c = index % 5 + 1;
    index = Math.floor(index / 5);
    return {a: Math.floor(index / 6) + 2, b: index % 6 + 1, c, numerator, denominator};
}

/** The approved structural quantities share one positive denominator; no unused evaluations participate. */
function participatingNumerators(family: NumericFamily, raw: ReturnType<typeof rawInputsAt>) {
    const n = family === 'quotient' && raw.numerator === 0 ? -1 : raw.numerator;
    const d = family === 'quotient' && raw.numerator === 0 ? 2 : raw.denominator;
    const {a, b, c} = raw;
    return {denominator: d, numerators: family === 'terms' ? [a * d, b * d, c * d, n, a * n, -b * n]
        : family === 'pair' || family === 'quotient' ? [a * d, n] : [a * d, b * d, n]};
}

/** Compact integer tickets preserve duplicate raw paths, rather than storing generated expression trees. */
const domains = new Map<string, Uint16Array>();
const usedRanges = new Set<CanonicalNumericRange>();
for (const family of ['terms', 'pair', 'grouped', 'quotient'] as const) {
    const cells = new Map<string, number[]>();
    for (let index = 0; index < 8 * 6 * 5 * 17 * 4; index++) {
        const {numerators, denominator: d} = participatingNumerators(family, rawInputsAt(index));
        const profile = ((numerators.some(n => n < 0) ? 3 : 1) + Number(numerators.includes(0))) as AlgebraNumericProfile;
        const minimum = Math.min(...numerators.map(Math.abs)), maximum = Math.max(...numerators.map(Math.abs));
        const chosen = candidates.find(({range}) => minimum >= range.min * d && maximum <= range.max * d
            && maximum > range.maximumAbove * d && minimum < range.minimumBelow * d);
        if (!chosen) {
            if (minimum === maximum && candidates.some(({range}) => maximum === range.max * d)) continue;
            throw new Error('A structural numeric input has no canonical range.');
        }
        usedRanges.add(chosen.range);
        const key = domainKey(family, profile, chosen.range);
        if (!cells.has(key)) cells.set(key, []);
        cells.get(key)!.push(index);
    }
    for (const [key, indices] of cells) domains.set(key, Uint16Array.from(indices));
}
export const numericExpressionRangeProfiles = candidates.filter(profile => usedRanges.has(profile.range));
function domainFor(relation: string, profile: AlgebraNumericProfile, range: CanonicalNumericRange) {
    const family = familyFor(relation);
    const validRange = range && !Object.is(range.min, -0) && numericExpressionRangeProfiles.find(candidate =>
        Object.entries(candidate.range).every(([key, value]) => range[key as keyof CanonicalNumericRange] === value));
    return family && validRange ? domains.get(domainKey(family, profile, range)) : undefined;
}
export const numericExpressionCaseCount = (relation: string, profile: AlgebraNumericProfile, range: CanonicalNumericRange): number =>
    domainFor(relation, profile, range)?.length ?? 0;

export function numericExpressionInputsAt(relation: string, profile: AlgebraNumericProfile,
    range: CanonicalNumericRange, index: number): ExpressionInputs {
    const domain = domainFor(relation, profile, range);
    if (!domain || !Number.isInteger(index) || index < 0 || index >= domain.length) {
        throw new RangeError('Unsupported structural numeric profile or case index.');
    }
    const {a, b, c, numerator, denominator} = rawInputsAt(domain[index]!);
    return {a, b, c, input: makeSignedRational(numerator, denominator)};
}
