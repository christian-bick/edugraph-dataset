import {random} from '../../../lib/random.ts';
import type {
    DimensionedRational, DimensionUnitPowers, DimensionUnitSymbol, MeasurementRatioRelationProblem,
    MeasurementRatioUnit, PhysicalDimensionPowers, RatioRational, UnitDimensionRelationProblem
} from '../../../types/problems.ts';
import {isRatioRational} from '../ratio/ratio-language-presentation.ts';

export type ConversionDirection = 'first-to-second' | 'second-to-first';

export function selectConversionDirection(): ConversionDirection {
    return random() < 0.5 ? 'first-to-second' : 'second-to-first';
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
    typeof value === 'object' && value !== null && !Array.isArray(value);
const positiveRational = (value: unknown): value is RatioRational =>
    isRatioRational(value) && value.numerator > 0;
const nonemptyText = (value: unknown): value is string => typeof value === 'string' && value.trim().length > 0;
const unit = (value: unknown): value is MeasurementRatioUnit => isRecord(value)
    && [value.id, value.name, value.symbol].every(nonemptyText)
    && ['metric', 'customary', 'time'].includes(String(value.system))
    && ['length', 'mass', 'volume', 'time'].includes(String(value.dimension));

const productEquals = (left: RatioRational, right: RatioRational, result: RatioRational): boolean =>
    BigInt(left.numerator) * BigInt(right.numerator) * BigInt(result.denominator)
    === BigInt(result.numerator) * BigInt(left.denominator) * BigInt(right.denominator);

export function isMeasurementRatioRelation(data: unknown): data is MeasurementRatioRelationProblem {
    if (!isRecord(data) || data.kind !== 'measurement-ratio-relation'
        || !isRecord(data.units) || !unit(data.units.first) || !unit(data.units.second)
        || data.units.first.id === data.units.second.id || data.units.first.symbol === data.units.second.symbol
        || data.units.first.dimension !== data.units.second.dimension
        || !isRecord(data.unitEquality) || !positiveRational(data.unitEquality.first)
        || !positiveRational(data.unitEquality.second)
        || !isRecord(data.quantityEquality) || !positiveRational(data.quantityEquality.first)
        || !positiveRational(data.quantityEquality.second)
        || !positiveRational(data.scaleFactor) || !positiveRational(data.forwardFactor)
        || !positiveRational(data.reverseFactor)) return false;
    return productEquals(data.unitEquality.first, data.scaleFactor, data.quantityEquality.first)
        && productEquals(data.unitEquality.second, data.scaleFactor, data.quantityEquality.second)
        && productEquals(data.unitEquality.first, data.forwardFactor, data.unitEquality.second)
        && productEquals(data.unitEquality.second, data.reverseFactor, data.unitEquality.first);
}

const symbols = ['m', 's', 'kg'] as const;
const physicalDimensions = ['length', 'time', 'mass'] as const;
const powers = (value: unknown, keys: readonly string[]): value is Record<string, number> =>
    isRecord(value) && Object.keys(value).length === keys.length
    && keys.every(key => typeof value[key] === 'number' && Number.isSafeInteger(value[key]));

const dimensioned = (value: unknown): value is DimensionedRational => {
    if (!isRecord(value) || !positiveRational(value.value) || !powers(value.units, symbols)
        || !powers(value.dimensions, physicalDimensions)) return false;
    const {units, dimensions} = value;
    return symbols.every((symbol, index) => units[symbol] === dimensions[physicalDimensions[index]!]);
};

/** Validate raw unit factors and their supplied cancellation witness against the operands. */
export function isUnitDimensionRelation(data: unknown): data is UnitDimensionRelationProblem {
    if (!isRecord(data) || data.kind !== 'unit-dimension-relation'
        || !['multiplication', 'division'].includes(String(data.operation))
        || !dimensioned(data.left) || !dimensioned(data.right) || !dimensioned(data.result)
        || !isRecord(data.unitFactors) || !Array.isArray(data.unitFactors.numerator)
        || !Array.isArray(data.unitFactors.denominator)
        || !data.unitFactors.numerator.every(symbol => symbols.includes(symbol as DimensionUnitSymbol))
        || !data.unitFactors.denominator.every(symbol => symbols.includes(symbol as DimensionUnitSymbol))
        || !Array.isArray(data.cancellations)) return false;
    const {left, right, result} = data;
    const sign = data.operation === 'multiplication' ? 1 : -1;
    if (!(data.operation === 'multiplication' ? productEquals(left.value, right.value, result.value)
        : productEquals(right.value, result.value, left.value))) return false;
    const numerator = data.unitFactors.numerator as DimensionUnitSymbol[];
    const denominator = data.unitFactors.denominator as DimensionUnitSymbol[];
    if (!symbols.every(symbol => {
        const rightPower = sign * right.units[symbol];
        return result.units[symbol] === left.units[symbol] + rightPower
            && numerator.filter(candidate => candidate === symbol).length
                === Math.max(0, left.units[symbol]) + Math.max(0, rightPower)
            && denominator.filter(candidate => candidate === symbol).length
                === Math.max(0, -left.units[symbol]) + Math.max(0, -rightPower);
    })) return false;
    const usedNumerators = new Set<number>();
    const usedDenominators = new Set<number>();
    for (const cancellation of data.cancellations) {
        if (!isRecord(cancellation) || typeof cancellation.numeratorIndex !== 'number'
            || typeof cancellation.denominatorIndex !== 'number'
            || !Number.isSafeInteger(cancellation.numeratorIndex) || !Number.isSafeInteger(cancellation.denominatorIndex)
            || cancellation.numeratorIndex < 0 || cancellation.numeratorIndex >= numerator.length
            || cancellation.denominatorIndex < 0 || cancellation.denominatorIndex >= denominator.length
            || usedNumerators.has(cancellation.numeratorIndex) || usedDenominators.has(cancellation.denominatorIndex)
            || numerator[cancellation.numeratorIndex] !== denominator[cancellation.denominatorIndex]) return false;
        usedNumerators.add(cancellation.numeratorIndex);
        usedDenominators.add(cancellation.denominatorIndex);
    }
    const remainingTop = numerator.filter((_, index) => !usedNumerators.has(index));
    const remainingBottom = denominator.filter((_, index) => !usedDenominators.has(index));
    return !remainingTop.some(symbol => remainingBottom.includes(symbol));
}

export const measurementRationalText = ({numerator, denominator}: RatioRational): string =>
    denominator === 1 ? String(numerator) : `(${numerator}/${denominator})`;

export const conversionProjection = (data: MeasurementRatioRelationProblem, direction: ConversionDirection) =>
    direction === 'first-to-second' ? {
        sourceUnit: data.units.first, targetUnit: data.units.second,
        sourceValue: data.quantityEquality.first, targetValue: data.quantityEquality.second,
        ratioNumerator: data.unitEquality.second, ratioDenominator: data.unitEquality.first,
        numericFactor: data.forwardFactor
    } : {
        sourceUnit: data.units.second, targetUnit: data.units.first,
        sourceValue: data.quantityEquality.second, targetValue: data.quantityEquality.first,
        ratioNumerator: data.unitEquality.first, ratioDenominator: data.unitEquality.second,
        numericFactor: data.reverseFactor
    };

const powerText = (name: string, power: number): string => power === 1 ? name : `${name}^${power}`;

function formatPowers(value: Record<string, number>, keys: readonly string[]): string {
    const numerator = keys.filter(key => value[key]! > 0).map(key => powerText(key, value[key]!));
    const denominator = keys.filter(key => value[key]! < 0).map(key => powerText(key, -value[key]!));
    const top = numerator.length === 0 ? '1' : numerator.join(' · ');
    return denominator.length === 0 ? top : `${top} / (${denominator.join(' · ')})`;
}

export const dimensionUnitText = (value: DimensionUnitPowers): string => formatPowers(value, symbols);
export const physicalDimensionText = (value: PhysicalDimensionPowers): string => {
    const expression = formatPowers(value, physicalDimensions);
    return expression === '1' ? 'dimensionless' : expression;
};
