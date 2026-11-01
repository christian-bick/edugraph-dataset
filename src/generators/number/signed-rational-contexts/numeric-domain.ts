import {canonicalRangeProfiles} from '../../../lib/canonical-range-labels.ts';
import type {CanonicalNumericRange} from '../../../lib/canonical-numeric-range.ts';
import type {SignedRationalContextMetadata} from '../../../types/problems.ts';

type ContextKind = SignedRationalContextMetadata['kind'];
const contexts: readonly ContextKind[] = ['temperature', 'elevation', 'balance', 'charge'];
interface DirectedBlock {
    context: ContextKind;
    denominator: number;
    first: number;
    last: number;
    neighbor: boolean;
    weight: number;
    count: number;
}
export const signedContextRangeProfiles = canonicalRangeProfiles.filter(({range}) =>
    range.max === 5 && range.min === 0 || range.max === 10 && range.min === 5);

/**
 * The old path probability is1/(4 contexts ×D denominators ×10d numerators ×2 pair classes ×2 orders).
 * Common denominator115200 gives per-path weights120/d for six denominator choices and180/d for four.
 * Equal-magnitude5/10 paths are the only retired singletons. Neighbor paths never straddle5 strictly.
 */
function blocksForRange(range: CanonicalNumericRange): DirectedBlock[] {
    return contexts.flatMap(context => (context === 'balance' ? [1, 2, 4, 5] : [1, 2, 3, 4, 5, 6])
        .flatMap(denominator => [false, true].map(neighbor => {
            const first = range.max === 5 ? 1 : 5 * denominator + (neighbor ? 0 : 1);
            const last = range.max === 5 ? 5 * denominator - 1 : 10 * denominator - (neighbor ? 0 : 1);
            const weight = (context === 'balance' ? 180 : 120) / denominator;
            return {context, denominator, first, last, neighbor, weight, count: (last - first + 1) * 2 * weight};
        })));
}
const domains = signedContextRangeProfiles.map(profile => {
    const blocks = blocksForRange(profile.range);
    return {...profile, blocks, count: blocks.reduce((sum, block) => sum + block.count, 0)};
});
function domainForRange(range: CanonicalNumericRange) {
    return domains.find(profile => Object.entries(profile.range)
        .every(([key, value]) => range?.[key as keyof CanonicalNumericRange] === value));
}
export const directedContextCaseCount = (range: CanonicalNumericRange): number => domainForRange(range)?.count ?? 0;

/** Decode one weighted original path before constructing any mathematical payload. */
export function directedContextFrameAt(range: CanonicalNumericRange, index: number) {
    const domain = domainForRange(range);
    if (!domain || !Number.isSafeInteger(index) || index < 0 || index >= domain.count) {
        throw new RangeError('Unsupported directed-context profile or case index.');
    }
    let offset = index;
    for (const block of domain.blocks) {
        if (offset < block.count) {
            const path = Math.floor(offset / block.weight);
            return {context: block.context, denominator: block.denominator, numerator: block.first + Math.floor(path / 2),
                neighbor: block.neighbor, positiveFirst: path % 2 === 0};
        }
        offset -= block.count;
    }
    throw new RangeError('Directed-context index exceeded its finite domain.');
}
