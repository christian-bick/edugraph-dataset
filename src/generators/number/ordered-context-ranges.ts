import {canonicalRangeProfiles} from '../../lib/canonical-range-labels.ts';
import type {CanonicalNumericRange} from '../../lib/canonical-numeric-range.ts';
import {GeneratorValidationError} from '../../lib/errors.ts';
import {random} from '../../lib/random.ts';
import {makeSignedRational} from './signed-rational-helpers.ts';
import {buildOrderedContextPair, type OrderedContextKind} from './ordered-context-helpers.ts';

export type ContextSignDomain = 'signed' | 'nonnegative';
interface ContextBlock {
    context: OrderedContextKind;
    denominator: number;
    pattern: number;
    numerator: number;
    otherFirst: number;
    otherLast: number;
    weight: number;
    begin: number;
    end: number;
}
const contexts: readonly OrderedContextKind[] = ['temperature', 'elevation', 'balance'];
const denominators = (context: OrderedContextKind): readonly number[] => context === 'balance' ? [1, 2, 4, 5] : [1, 2, 3, 4, 5, 6];
const patterns = (domain: ContextSignDomain): readonly number[] => domain === 'signed' ? [0, 1, 2, 3] : [4];
export const orderedContextRangeProfiles = canonicalRangeProfiles.filter(({range}) =>
    range.min === 0 && (range.max === 5 || range.max === 10));

/** Original conditional path denominator: context, denominator, pattern, n, optional m, then order. */
function probabilityDenominator(domain: ContextSignDomain, context: OrderedContextKind, denominator: number, pattern: number) {
    const maximum = 10 * denominator;
    const firstCount = pattern === 4 ? maximum + 1 : maximum;
    const secondCount = pattern === 4 ? maximum : pattern === 0 || pattern === 3 ? maximum - 1 : 1;
    return 3 * denominators(context).length * patterns(domain).length * firstCount * secondCount * 2;
}
function weightBase(domain: ContextSignDomain): number {
    let common = 1n;
    for (const context of contexts) for (const denominator of denominators(context)) for (const pattern of patterns(domain)) {
        const value = BigInt(probabilityDenominator(domain, context, denominator, pattern));
        let a = common, b = value;
        while (b !== 0n) [a, b] = [b, a % b];
        common = common / a * value;
    }
    if (common > BigInt(Number.MAX_SAFE_INTEGER)) throw new Error('Ordered-context weights exceed exact numeric indexing.');
    return Number(common);
}
const bases = {signed: weightBase('signed'), nonnegative: weightBase('nonnegative')};

/** Compact m intervals retain all original pattern weights; datum0 makes every lower descriptor unnecessary. */
function buildDomain(domain: ContextSignDomain, range: CanonicalNumericRange) {
    const blocks: ContextBlock[] = [];
    let count = 0, rawPaths = 0;
    for (const context of contexts) for (const denominator of denominators(context)) for (const pattern of patterns(domain)) {
        const maximum = 10 * denominator, threshold = 5 * denominator;
        const weight = bases[domain] / probabilityDenominator(domain, context, denominator, pattern);
        for (let numerator = pattern === 4 ? 0 : 1; numerator <= maximum; numerator++) {
            const append = (otherFirst: number, otherLast: number) => {
                if (otherFirst > otherLast) return;
                const paths = (otherLast - otherFirst + 1) * 2;
                const begin = count;
                count += paths * weight;
                rawPaths += paths;
                blocks.push({context, denominator, pattern, numerator, otherFirst, otherLast, weight, begin, end: count});
            };
            if (pattern === 1 || pattern === 2) {
                if ((range.max === 5) === (numerator <= threshold)) append(0, 0);
                continue;
            }
            let first = pattern === 4 ? 0 : 1, last = maximum;
            if (range.max === 5) {
                if (numerator > threshold) continue;
                last = threshold;
            } else if (numerator <= threshold) first = threshold + 1;
            append(first, Math.min(last, numerator - 1));
            append(Math.max(first, numerator + 1), last);
        }
    }
    if (!Number.isSafeInteger(count)) throw new Error('Ordered-context pool size is not an exact safe integer.');
    return {blocks, count, rawPaths};
}
const domains = (['signed', 'nonnegative'] as const).flatMap(signDomain => orderedContextRangeProfiles.map(profile =>
    ({signDomain, range: profile.range, ...buildDomain(signDomain, profile.range)})
));
function domainForRange(signDomain: string, range: CanonicalNumericRange) {
    return domains.find(domain => domain.signDomain === signDomain && Object.entries(domain.range)
        .every(([key, value]) => range?.[key as keyof CanonicalNumericRange] === value));
}
export const orderedContextCaseCount = (signDomain: string, range: CanonicalNumericRange): number =>
    domainForRange(signDomain, range)?.count ?? 0;
export const orderedContextRawPathCount = (signDomain: string, range: CanonicalNumericRange): number =>
    domainForRange(signDomain, range)?.rawPaths ?? 0;

/** Binary-search the weighted interval, then decode the original n/m/order path before payload construction. */
export function orderedContextFrameAt(signDomain: string, range: CanonicalNumericRange, index: number) {
    const domain = domainForRange(signDomain, range);
    if (!domain || !Number.isSafeInteger(index) || index < 0 || index >= domain.count) {
        throw new RangeError('Unsupported ordered-context profile or case index.');
    }
    let low = 0, high = domain.blocks.length - 1;
    while (low < high) {
        const middle = Math.floor((low + high) / 2);
        if (index < domain.blocks[middle]!.end) high = middle;
        else low = middle + 1;
    }
    const block = domain.blocks[low]!;
    const path = Math.floor((index - block.begin) / block.weight);
    return {context: block.context, denominator: block.denominator, pattern: block.pattern,
        numerator: block.numerator, otherNumerator: block.otherFirst + Math.floor(path / 2), swapped: path % 2 === 1};
}

export function sampleCanonicalOrderedContextPair(signDomain: ContextSignDomain, range: CanonicalNumericRange) {
    const count = orderedContextCaseCount(signDomain, range);
    if (count === 0) throw new GeneratorValidationError('ordered-rational-contexts', 'Unsupported canonical contextual range.');
    const frame = orderedContextFrameAt(signDomain, range, Math.floor(random() * count));
    const first = makeSignedRational(frame.pattern === 4 ? frame.numerator : -frame.numerator, frame.denominator);
    const second = makeSignedRational(frame.pattern === 0 ? -frame.otherNumerator : frame.pattern === 1 ? frame.numerator
        : frame.pattern === 2 ? 0 : frame.otherNumerator, frame.denominator);
    return frame.swapped ? buildOrderedContextPair(frame.context, second, first) : buildOrderedContextPair(frame.context, first, second);
}
