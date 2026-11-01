import {createCanonicalNumericRange} from '../../../lib/canonical-numeric-range.ts';
import {getRandomState} from '../../../lib/random.ts';
import {divisionOperandProfiles, type DivisionGroupCountProfile, type DivisionOperandProfile} from './operand-profiles.ts';
import {divisionRangeRows, hasSharedDivisionRange} from './numeric-domain.ts';
import {originalDivisionRange} from './spec.ts';

/** Concrete range selection for historical test fixtures; production resolves
 * ranges through declared schema choices and does not import this helper. */
export function divisionFixtureRange(profile?: string, group?: string) {
    if (!profile || !Object.hasOwn(divisionOperandProfiles, profile) || !['zero', 'positive'].includes(group ?? ''))
        return createCanonicalNumericRange(5);
    const role = profile as DivisionOperandProfile, count = group as DivisionGroupCountProfile;
    if (!hasSharedDivisionRange(role, count)) return originalDivisionRange;
    const ranges = [5, 10, 20, 100].map(upper => createCanonicalNumericRange(upper)).filter(range => divisionRangeRows(role, count, range).length);
    return ranges[Math.floor(getRandomState() / 7) % ranges.length]!;
}
