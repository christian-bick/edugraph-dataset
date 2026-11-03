import {createCanonicalNumericRange, type CanonicalNumericRange} from '../../lib/canonical-numeric-range.ts';
import {GeneratorValidationError} from '../../lib/errors.ts';
import type {FractionProductFractionOperand, FractionProductMixedOperand, FractionProductProblem,
    FractionProductRelationProblem, FractionProductValue} from '../../types/problems.ts';

export const fractionProductProfiles = ['fraction-partition-proper', 'fraction-partition-improper',
    'fraction-equation-proper', 'fraction-equation-improper', 'mixed-equation'] as const;
export type FractionProductProfile = typeof fractionProductProfiles[number];
export type FractionProductContract = 'derivation' | 'relation';
export type FractionProductOperands =
    | {readonly operandForm: 'fractions'; readonly multiplier: FractionProductFractionOperand; readonly quantity: FractionProductFractionOperand}
    | {readonly operandForm: 'mixed-numbers'; readonly multiplier: FractionProductMixedOperand; readonly quantity: FractionProductMixedOperand};
export type WeightedFractionProductOperands = FractionProductOperands & {readonly weight: number};

const upperBounds = {
    derivation: [[5, 10, 20, 100], [5, 10, 20, 100, 120], [5, 10, 20], [5, 10, 20, 100], [5, 10, 20, 100]],
    relation: [[5, 10], [5, 10, 20], [5, 10], [5, 10, 20], [5, 10, 20]]
} as const;

export function fractionProductUpperBounds(contract: FractionProductContract, profile: FractionProductProfile): readonly number[] {
    const index = fractionProductProfiles.indexOf(profile);
    if (!upperBounds[contract] || index < 0)
        throw new GeneratorValidationError('fraction-products', 'Choose a supported mathematical product contract and profile.');
    return upperBounds[contract][index]!;
}

const fraction = (numerator: number, denominator: number): FractionProductFractionOperand => ({form: 'fraction', numerator, denominator});
const value = (operand: FractionProductFractionOperand | FractionProductMixedOperand): FractionProductValue =>
    ({numerator: operand.form === 'mixed' ? operand.improperNumerator : operand.numerator, denominator: operand.denominator});

function fractionFactors(proper: boolean) {
    return Array.from({length: 5}, (_, index) => index + 2).flatMap(denominator => {
        const first = proper ? 1 : denominator + 1, last = proper ? denominator - 1 : 3 * denominator - 1;
        return Array.from({length: last - first + 1}, (_, index) => first + index)
            .filter(numerator => proper || numerator !== 2 * denominator)
            .map(numerator => ({operand: fraction(numerator, denominator), weight: proper ? 60 / (denominator - 1)
                : 3465 / (2 * denominator - 1) * (numerator === 2 * denominator + 1 ? 2 : 1)}));
    });
}

function fractionalQuantities() {
    return Array.from({length: 5}, (_, index) => index + 2).flatMap(denominator =>
        Array.from({length: 3 * denominator - 1}, (_, index) => index + 1)
            .filter(numerator => numerator % denominator !== 0)
            .map(numerator => ({operand: fraction(numerator, denominator), weight: 60 / (denominator - 1)})));
}

function mixedOperands(maximumWhole: number) {
    return Array.from({length: maximumWhole}, (_, index) => index + 1).flatMap(whole =>
        Array.from({length: 5}, (_, index) => index + 2).flatMap(denominator =>
            Array.from({length: denominator - 1}, (_, index) => index + 1).map(fractionNumerator => ({
                operand: {form: 'mixed', whole, fractionNumerator, denominator,
                    improperNumerator: whole * denominator + fractionNumerator} as const,
                weight: 60 / (denominator - 1)
            }))));
}

const nativeDomains = new Map<FractionProductProfile, readonly WeightedFractionProductOperands[]>();
/** Exact integer weights preserve the original nested draws, including the doubled improper numerator. */
export function fractionProductNativeDomain(profile: FractionProductProfile): readonly WeightedFractionProductOperands[] {
    if (!fractionProductProfiles.includes(profile))
        throw new GeneratorValidationError('fraction-products', 'Choose a supported product profile.');
    const cached = nativeDomains.get(profile);
    if (cached) return cached;
    const rows: WeightedFractionProductOperands[] = profile === 'mixed-equation'
        ? mixedOperands(2).flatMap(multiplier => mixedOperands(3).map(quantity => ({operandForm: 'mixed-numbers' as const,
            multiplier: multiplier.operand, quantity: quantity.operand, weight: multiplier.weight * quantity.weight})))
        : fractionFactors(profile.endsWith('-proper')).flatMap(multiplier => {
            const quantities = [...fractionalQuantities(), ...(profile.startsWith('fraction-partition-')
                ? Array.from({length: 6}, (_, index) => ({operand: fraction(index + 1, 1), weight: 150})) : [])];
            return quantities.map(quantity => ({operandForm: 'fractions' as const, multiplier: multiplier.operand,
                quantity: quantity.operand, weight: multiplier.weight * quantity.weight}));
        });
    nativeDomains.set(profile, rows);
    return rows;
}

/** Mathematical quantities required by the equal-parts relation and, separately, its alternate derivation. */
export function fractionProductQuantities(operands: FractionProductOperands, contract: FractionProductContract): readonly FractionProductValue[] {
    const multiplier = value(operands.multiplier), quantity = value(operands.quantity);
    const a = multiplier.numerator, b = multiplier.denominator, q = quantity.numerator, c = quantity.denominator;
    return [multiplier, quantity, {numerator: a * q, denominator: b * c}, {numerator: q, denominator: b * c},
        ...[a, b, Math.ceil(a / b)].map(numerator => ({numerator, denominator: 1})),
        ...(contract === 'derivation' ? [{numerator: a * q, denominator: c}] : [])];
}

const rangedDomains = new Map<string, readonly WeightedFractionProductOperands[]>();
export function fractionProductDomain(contract: FractionProductContract, profile: FractionProductProfile,
    range: CanonicalNumericRange): readonly WeightedFractionProductOperands[] {
    const allowed = fractionProductUpperBounds(contract, profile);
    if (!range || range.min !== 0 || !allowed.includes(range.max))
        throw new GeneratorValidationError('fraction-products', 'Choose a feasible canonical product range.');
    const canonical = createCanonicalNumericRange(range.max);
    if (range.maximumAbove !== canonical.maximumAbove || range.minimumBelow !== canonical.minimumBelow)
        throw new GeneratorValidationError('fraction-products', 'Canonical product witnesses must agree with the bounds.');
    const key = `${contract}:${profile}:${range.max}`;
    const cached = rangedDomains.get(key);
    if (cached) return cached;
    const rows = fractionProductNativeDomain(profile).filter(operands => {
        const quantities = fractionProductQuantities(operands, contract);
        return quantities.every(({numerator, denominator}) => numerator <= range.max * denominator)
            && quantities.some(({numerator, denominator}) => numerator > range.maximumAbove * denominator)
            && quantities.some(({numerator, denominator}) => numerator < range.minimumBelow * denominator);
    });
    if (!rows.length) throw new GeneratorValidationError('fraction-products', 'The canonical product range has no native support.');
    rangedDomains.set(key, rows);
    return rows;
}

/** Selects from an already conditioned finite domain without changing its native relative weights. */
export function selectFractionProductOperands(rows: readonly WeightedFractionProductOperands[], draw: number): FractionProductOperands {
    if (!Number.isFinite(draw) || draw < 0 || draw >= 1 || !rows.length)
        throw new GeneratorValidationError('fraction-products', 'A product draw must lie in the half-open unit interval.');
    let remaining = draw * rows.reduce((sum, row) => sum + row.weight, 0);
    for (const row of rows) {
        remaining -= row.weight;
        if (remaining < 0) return row;
    }
    throw new GeneratorValidationError('fraction-products', 'A product draw must lie in the half-open unit interval.');
}

function common(operands: FractionProductOperands, profile: FractionProductProfile, material: 'ribbon' | 'rope') {
    const multiplierValue = value(operands.multiplier), quantityValue = value(operands.quantity);
    const a = multiplierValue.numerator, b = multiplierValue.denominator;
    const q = quantityValue.numerator, c = quantityValue.denominator;
    const product = {numerator: a * q, denominator: b * c};
    return {sharedWhole: 1 as const, multiplierValue, quantityValue, product,
        context: {material, measureUnit: 'meter' as const},
        partition: {equalPartsPerCopy: b, selectedPartCount: a, copyCount: Math.ceil(a / b),
            availablePartCount: Math.ceil(a / b) * b, onePartValue: {numerator: q, denominator: b * c}},
        ...(!profile.startsWith('fraction-partition-') ? {equationWitness: {factor: multiplierValue,
            referenceMeasure: quantityValue, productMeasure: product, measureUnit: 'meter' as const}} : {})};
}

function originalOperands(operands: FractionProductOperands): FractionProductOperands {
    return operands.operandForm === 'fractions'
        ? {operandForm: 'fractions', multiplier: operands.multiplier, quantity: operands.quantity}
        : {operandForm: 'mixed-numbers', multiplier: operands.multiplier, quantity: operands.quantity};
}

export function buildFractionProduct(operands: FractionProductOperands, profile: FractionProductProfile,
    material: 'ribbon' | 'rope'): FractionProductProblem {
    const data = common(operands, profile, material), a = data.multiplierValue.numerator;
    return {...data, ...originalOperands(operands), kind: 'fraction-product', partition: {...data.partition,
        scaledQuantity: {numerator: a * data.quantityValue.numerator, denominator: data.quantityValue.denominator}}};
}

export function buildFractionProductRelation(operands: FractionProductOperands, profile: FractionProductProfile,
    material: 'ribbon' | 'rope'): FractionProductRelationProblem {
    return {...common(operands, profile, material), ...originalOperands(operands), kind: 'fraction-product-relation'};
}
