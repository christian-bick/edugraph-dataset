import {canonicalRangeProfiles} from '../../../lib/canonical-range-labels.ts';
import type {CanonicalNumericRange} from '../../../lib/canonical-numeric-range.ts';
import {rational} from '../../ratio/helpers.ts';
import {measurementConversionPairSeeds} from '../helpers.ts';

const conversionRatioFacts = [
    ...Object.values(measurementConversionPairSeeds).map(pair => ({
        first: pair.largerUnit, second: pair.smallerUnit, firstValue: 1, secondValue: pair.factor
    })),
    {first: 'inch' as const, second: 'centimeter' as const, firstValue: 50, secondValue: 127}
];

/** Required identity1 rules out positive floors; each remaining finite source slice is contiguous. */
function blocksForRange(range: CanonicalNumericRange) {
    if (range.min !== 0) return [];
    return conversionRatioFacts.flatMap(fact => [1, 2, 4].flatMap(denominator => {
        const unitMaximum = Math.max(fact.firstValue, fact.secondValue);
        if (unitMaximum > range.max) return [];
        // The source cap constrains the original unreduced numerator, independently of notation.
        const sourceMaximum = Math.floor(99999 / unitMaximum);
        const first = unitMaximum > range.maximumAbove ? 1
            : Math.floor(range.maximumAbove * denominator / unitMaximum) + 1;
        const last = Math.min(sourceMaximum, Math.floor(range.max * denominator / unitMaximum));
        return first <= last ? [{fact, denominator, first, last, count: last - first + 1}] : [];
    }));
}
const profileDomains = canonicalRangeProfiles.map(profile => {
    const blocks = blocksForRange(profile.range);
    return {...profile, blocks, count: blocks.reduce((total, block) => total + block.count, 0)};
}).filter(profile => profile.count > 0);

export const conversionRatioRangeProfiles = profileDomains.map(({labels, range}) => ({labels, range}));
export const conversionRatioDomainFootprint = {
    profiles: profileDomains.length,
    blocks: profileDomains.reduce((count, profile) => count + profile.blocks.length, 0),
    outcomes: profileDomains.reduce((count, profile) => count + profile.count, 0)
};

function domainForRange(range: CanonicalNumericRange) {
    return profileDomains.find(profile =>
        Object.entries(profile.range).every(([key, value]) => range?.[key as keyof CanonicalNumericRange] === value)
    );
}
export const conversionRatioCaseCount = (range: CanonicalNumericRange): number => domainForRange(range)?.count ?? 0;

/** Decode one original fact/numerator/denominator draw without materializing its payload at import. */
export function conversionRatioFrameAt(range: CanonicalNumericRange, index: number) {
    const domain = domainForRange(range);
    if (!domain || !Number.isSafeInteger(index) || index < 0 || index >= domain.count) {
        throw new RangeError('Unsupported conversion-ratio profile or case index.');
    }
    let offset = index;
    for (const block of domain.blocks) {
        if (offset < block.count) return {fact: block.fact, scaleFactor: rational(block.first + offset, block.denominator)};
        offset -= block.count;
    }
    throw new RangeError('Conversion-ratio case index exceeded its finite domain.');
}
