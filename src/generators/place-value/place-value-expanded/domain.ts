import {createCanonicalNumericRange, hasCanonicalRangeWitness, type CanonicalNumericRange} from '../../../lib/canonical-numeric-range.ts';
import {GeneratorValidationError} from '../../../lib/errors.ts';
import {createWholeNumberPlaceValues} from '../../../lib/whole-number-notation.ts';

const cache = new Map<string, readonly number[]>();
export const expandedRangeBounds = [
    ...[120, 1000].flatMap(upper => [0, 5, 10, 20].map(lower => [upper, lower] as const)),
    ...[0, 5, 10, 20, 100, 120].map(lower => [10000, lower] as const),
    ...[0, 5, 10, 20, 100, 120, 1000].map(lower => [100000, lower] as const),
    ...[0, 5, 10, 20, 100, 120, 1000, 10000].map(lower => [1000000, lower] as const)
];

/** Three nonzero places require two places above the smallest term. */
export function hasExpandedCardinalityDomain(upper: number, lower: number, cardinality: number): boolean {
    if (![2, 3].includes(cardinality)
        || !expandedRangeBounds.some(([max, min]) => upper === max && lower === min)) return false;
    const largestThreeTermLower = upper <= 1000 ? 5 : upper === 10000 ? 20 : upper === 100000 ? 120 : 1000;
    return cardinality === 2 || lower <= largestThreeTermLower;
}

/** Enumerate sparse numerals directly, instead of rejecting a million-wide
 * integer proposal. Leading digits are nonzero and all original cards2/3 remain. */
export function sparseExpandedNumbers(cardinality: number): readonly number[] {
    const values: number[] = [];
    const visit = (position: number, remaining: number, number: number, leading: boolean) => {
        if (remaining < 0 || remaining > position + 1) return;
        if (position < 0) {if (remaining === 0) values.push(number); return;}
        for (let digit = leading ? 1 : 0; digit <= 9; digit++)
            visit(position - 1, remaining - Number(digit !== 0), number + digit * 10 ** position, false);
    };
    for (let width = 3; width <= 6; width++) visit(width - 1, cardinality, 0, true);
    return values;
}

export function expandedQuantities(number: number): readonly number[] {
    const places = createWholeNumberPlaceValues(number);
    // The requested sum assesses each nonzero term. Place-strip digit glyphs
    // represent the numeral and do not introduce further quantities (SPEC-G2).
    return [number, ...places.filter(p => p.value > 0).map(p => p.value)];
}

export function expandedNumbers(range: CanonicalNumericRange, cardinality: number): readonly number[] {
    if (!range || !hasExpandedCardinalityDomain(range.max, range.min, cardinality))
        throw new GeneratorValidationError('place-value-expanded', 'Select an authored two/three-term canonical expanded-form domain.');
    const expected = createCanonicalNumericRange(range.max, range.min);
    if (range.maximumAbove !== expected.maximumAbove || range.minimumBelow !== expected.minimumBelow)
        throw new GeneratorValidationError('place-value-expanded', 'Canonical range witnesses must agree with the selected bounds.');
    const key = `${range.max}:${range.min}:${cardinality}`, previous = cache.get(key);
    if (previous) return previous;
    const candidates = sparseExpandedNumbers(cardinality).filter(number => (number < 1000) === (range.max <= 1000)
        && hasCanonicalRangeWitness(expandedQuantities(number), range));
    if (!candidates.length) throw new GeneratorValidationError('place-value-expanded', 'No expanded forms satisfy this term count and canonical range.');
    cache.set(key, candidates);
    return candidates;
}
