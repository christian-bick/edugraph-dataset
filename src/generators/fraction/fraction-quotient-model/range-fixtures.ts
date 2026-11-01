import {createCanonicalNumericRange} from '../../../lib/canonical-numeric-range.ts';
import {originalQuotientRange} from './range-profile.ts';

/** Explicit default profiles for pre-existing test fixtures. Production resolves
 * its mathematical range through the schema and never imports this helper. */
export const quotientFixtureRange = (role: string | undefined, profile?: string) => role?.startsWith('unit-dividend-')
    ? originalQuotientRange : createCanonicalNumericRange(role === 'fraction-as-quotient' || role === 'whole-sharing-equation'
        ? 10 : profile === 'zero' ? 5 : 100);
