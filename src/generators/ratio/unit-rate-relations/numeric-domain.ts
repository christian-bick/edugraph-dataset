import {canonicalRangeProfiles} from '../../../lib/canonical-range-labels.ts';
import {hasCanonicalRangeWitness, type CanonicalNumericRange} from '../../../lib/canonical-numeric-range.ts';
import {rational} from '../helpers.ts';

/** Original bounded source support, independent of the ontology's inclusive descriptors. */
const rateFrames = [rational(1, 2), rational(2), rational(3)].flatMap(scaleFactor => {
    const scale = scaleFactor.numerator / scaleFactor.denominator;
    const maximum = Math.floor(99 / Math.max(1, scale));
    return Array.from({length: maximum}, (_, first) => Array.from({length: 7}, (_, second) =>
        ({first: first + 1, second: second + 2, scaleFactor})
    )).flat();
});
type RateFrame = typeof rateFrames[number];

/** Both consumers require the original ratio, per-one normalization and requested scaling. */
export const rateFrameValues = ({first, second, scaleFactor}: RateFrame): number[] => {
    const scale = scaleFactor.numerator / scaleFactor.denominator;
    return [first, second, first / second, 1, scale, first * scale, second * scale];
};
export const unitRateRangeProfiles = canonicalRangeProfiles.filter(profile =>
    rateFrames.some(frame => hasCanonicalRangeWitness(rateFrameValues(frame), profile.range))
);

export function unitRateFramesForRange(range: CanonicalNumericRange) {
    const profile = unitRateRangeProfiles.find(profile =>
        Object.entries(profile.range).every(([key, value]) => range?.[key as keyof CanonicalNumericRange] === value)
    );
    return profile ? rateFrames.filter(frame => hasCanonicalRangeWitness(rateFrameValues(frame), profile.range)) : [];
}
