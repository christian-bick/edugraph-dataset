import {createCanonicalNumericRange, type CanonicalNumericRange} from '../../lib/canonical-numeric-range.ts';
import {GeneratorValidationError} from '../../lib/errors.ts';
import type {FractionUnitPartitionProblem, FractionUnitSharingProblem} from '../../types/problems.ts';

export type UnitSharingProfile = 'unit-dividend-basic' | 'unit-dividend-inverse' | 'unit-dividend-equation';
export type UnitSharingContract = 'partition' | 'sharing';
export const unitSharingProfileValues = ['unit-dividend-basic', 'unit-dividend-inverse', 'unit-dividend-equation'] as const;

export function unitSharingPairs(contract: UnitSharingContract, range: CanonicalNumericRange): readonly (readonly [number, number])[] {
    if (!['partition', 'sharing'].includes(contract) || !range || range.min !== 0 || !(contract === 'partition' ? [5, 10, 20, 100] : [5, 10]).includes(range.max))
        throw new GeneratorValidationError('fraction-unit-sharing', 'Choose a supported canonical sharing range.');
    const expected = createCanonicalNumericRange(range.max);
    if (range.maximumAbove !== expected.maximumAbove || range.minimumBelow !== expected.minimumBelow)
        throw new GeneratorValidationError('fraction-unit-sharing', 'Canonical sharing witnesses must agree with the bounds.');
    return Array.from({length: 5}, (_, b) => b + 2).flatMap(b => Array.from({length: 5}, (_, n) => n + 2)
        .filter(n => (contract === 'partition' ? b * n : n) <= range.max && (contract === 'partition' ? b * n : n) > range.maximumAbove)
        .map(n => [b, n] as const));
}

function relations(b: number, n: number, profile: UnitSharingProfile) {
    if (![b, n].every(value => Number.isSafeInteger(value) && value >= 2 && value <= 6)
        || !unitSharingProfileValues.includes(profile)) throw new GeneratorValidationError('fraction-unit-sharing', 'Expected native unit-sharing operands and a supported relation.');
    const dividend = {numerator: 1, denominator: b}, divisor = {numerator: n, denominator: 1};
    const quotient = {numerator: 1, denominator: b * n};
    return {dividend, divisor, quotient, inverse: {quotientFactor: quotient, divisorFactor: divisor, reconstructedDividend: dividend},
        ...(profile === 'unit-dividend-equation' ? {equationWitness: {totalMeasure: dividend, groupCount: divisor, measurePerGroup: quotient}} : {}),
        ...(profile === 'unit-dividend-inverse' ? {multiplicationWitness: {unreducedProduct: {numerator: n, denominator: b * n}, reconstructedDividend: dividend}} : {})};
}

export function buildUnitPartitionProblem(b: number, n: number, profile: UnitSharingProfile, material: 'ribbon' | 'rope'): FractionUnitPartitionProblem {
    return {kind: 'fraction-unit-partition', ...relations(b, n, profile), orientation: 'unit-fraction-by-whole',
        model: {kind: 'unit-part-sharing', wholePartitionCount: b, recipientCount: n, refinedPartitionCount: b * n, sharedFineParts: n},
        story: {material, measureUnit: 'meter', recipientUnit: 'person'}};
}

export function buildUnitSharingProblem(b: number, n: number, profile: UnitSharingProfile, material: 'ribbon' | 'rope'): FractionUnitSharingProblem {
    return {kind: 'fraction-unit-sharing', ...relations(b, n, profile), orientation: 'unit-fraction-by-whole', recipientCount: n,
        story: {material, measureUnit: 'meter', recipientUnit: 'person'}};
}
