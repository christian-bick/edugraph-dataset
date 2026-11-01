import {createCanonicalNumericRange, hasCanonicalRangeWitness, type CanonicalNumericRange} from '../../../lib/canonical-numeric-range.ts';
import {GeneratorValidationError} from '../../../lib/errors.ts';
import type {MultiDigitMultiplicationProblem} from '../../../types/problems.ts';
import type {OperandDigitProfile} from './spec.ts';

export const profileDigits = {
    'one-by-one': {smallest: 1, largest: 1}, 'one-by-two': {smallest: 1, largest: 2},
    'one-by-three': {smallest: 1, largest: 3}, 'one-by-four': {smallest: 1, largest: 4},
    'two-by-two': {smallest: 2, largest: 2}
} as const;

export const partialProductQuantities = (data: MultiDigitMultiplicationProblem): number[] => [
    data.smallestOperand, data.largestOperand, data.product,
    ...data.smallestDecomposition.parts.map(part => part.value), ...data.largestDecomposition.parts.map(part => part.value),
    ...data.partialProducts.map(part => part.product)
];

const operands = (digits: number): number[] => digits === 1 ? [1, 2, 3, 4, 5, 6, 7, 8, 9]
    : operands(digits - 1).flatMap(prefix => [1, 2, 3, 4, 5, 6, 7, 8, 9].map(digit => prefix * 10 + digit));
const values = new Map([1, 2, 3, 4].map(digits => [digits, operands(digits)]));
const frames = new Map<OperandDigitProfile, readonly (readonly [number, number])[]>();
for (const profile of Object.keys(profileDigits) as OperandDigitProfile[]) {
    const digits = profileDigits[profile];
    frames.set(profile, values.get(digits.smallest)!.flatMap(first => values.get(digits.largest)!
        .map(second => [Math.min(first, second), Math.max(first, second)] as const)));
}
const domains = new Map<string, readonly (readonly [number, number])[]>();

/** Retains original ordered digit draws, including duplicate sorted pairs and their exact weights. */
export function multiplicationDomain(profile: OperandDigitProfile, range: CanonicalNumericRange): readonly (readonly [number, number])[] {
    if (!Object.hasOwn(profileDigits, profile) || !range
        || ![5, 10, 20, 100, 120, 1000, 10000, 100000].includes(range.max)
        || ![0, 5].includes(range.min) || range.min >= range.max) {
        throw new GeneratorValidationError('multi-digit-multiplication', 'Expected a supported operand profile and reviewed canonical numeric bounds.');
    }
    const expected = createCanonicalNumericRange(range.max, range.min);
    if (range.maximumAbove !== expected.maximumAbove || range.minimumBelow !== expected.minimumBelow) {
        throw new GeneratorValidationError('multi-digit-multiplication', 'Canonical range witnesses are missing or inconsistent.');
    }
    const key = `${profile}:${range.min}:${range.max}`;
    // Every nonzero place component/product is between the two ones components and the full product.
    if (!domains.has(key)) domains.set(key, frames.get(profile)!.filter(([first, second]) =>
        hasCanonicalRangeWitness([first % 10, second % 10, first * second], range)));
    return domains.get(key)!;
}
