import {createCanonicalNumericRange, hasCanonicalRangeWitness, type CanonicalNumericRange} from '../../../lib/canonical-numeric-range.ts';
import {GeneratorValidationError} from '../../../lib/errors.ts';
import {createWholeNumberPlaceValues} from '../../../lib/whole-number-notation.ts';

const cache = new Map<string, readonly number[]>();
export const expandedRangeBounds = [
    ...[120, 1000].flatMap(upper => [0, 5, 10, 20].map(lower => [upper, lower] as const)),
    ...[10000, 100000, 1000000].map(upper => [upper, 0] as const)
];

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
    return [number, ...places.filter(p => p.value > 0).map(p => p.value),
        ...(number >= 1000 ? places.map(p => p.digit) : [])];
}

export function expandedNumbers(range: CanonicalNumericRange, cardinality: number): readonly number[] {
    if (!range || ![2, 3].includes(cardinality)
        || !expandedRangeBounds.some(([upper, lower]) => range.max === upper && range.min === lower))
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
