import {createCanonicalNumericRange, type CanonicalNumericRange} from '../../../lib/canonical-numeric-range.ts';
import type {SignedRational} from '../../../types/problems.ts';
import {makeSignedRational} from '../signed-rational-helpers.ts';

export type OppositeRelation = 'iterated-negation' | 'nonzero-opposition' | 'zero-fixed-point';
type OppositeRangeProfile = Readonly<{radiusTicks: number; step: SignedRational; originalTick: number; oppositeMagnitudeTick: number; weight: number}>;
const cache = new Map<string, readonly OppositeRangeProfile[]>();

/** The original cap10 lattice law, conditioned before generation on the selected
 * relation's actual projection. Duplicate reduced-step paths retain their mass. */
export function rationalOppositeRangeProfiles(relation: OppositeRelation, range: CanonicalNumericRange): readonly OppositeRangeProfile[] {
    if (!['iterated-negation', 'nonzero-opposition', 'zero-fixed-point'].includes(relation)
        || !range || range.min !== 0 || Object.is(range.min, -0) || ![5, 10].includes(range.max))
        throw new Error('Unsupported opposite relation or canonical range.');
    const expected = createCanonicalNumericRange(range.max);
    if (range.maximumAbove !== expected.maximumAbove || range.minimumBelow !== expected.minimumBelow)
        throw new Error('Invalid opposite range witnesses.');
    const key = `${relation}:${range.max}`;
    const cached = cache.get(key);
    if (cached) return cached;
    const profiles: OppositeRangeProfile[] = [];
    for (let radiusTicks = 2; radiusTicks <= 5; radiusTicks++) {
        const numeratorCount = Math.floor(10 / radiusTicks);
        const originalTicks = relation === 'zero-fixed-point' ? [0] : Array.from({length: 2 * radiusTicks + 1}, (_, index) => index - radiusTicks)
            .filter(tick => relation !== 'nonzero-opposition' || tick !== 0);
        for (let numerator = 1; numerator <= numeratorCount; numerator++) for (const denominator of [1, 2])
            for (const originalTick of originalTicks) for (let oppositeMagnitudeTick = 1; oppositeMagnitudeTick <= radiusTicks; oppositeMagnitudeTick++) {
                // Iterated negation has no axis. When the original is zero,
                // the question supplies the nonzero opposite pair as reference.
                const maximumTick = relation === 'iterated-negation'
                    ? Math.abs(originalTick) || oppositeMagnitudeTick : radiusTicks;
                const maximum = maximumTick * numerator / denominator;
                if (maximum <= range.max && maximum > range.maximumAbove) profiles.push({radiusTicks,
                    step: makeSignedRational(numerator, denominator), originalTick, oppositeMagnitudeTick,
                    weight: 1 / 4 / numeratorCount / 2 / originalTicks.length / radiusTicks});
            }
    }
    cache.set(key, profiles);
    return profiles;
}
