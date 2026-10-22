import type {RatioQuantity, RatioRational, RatioRelationProblem, UnitRateRelationProblem} from '../../../types/problems.ts';

const isRecord = (value: unknown): value is Record<string, unknown> =>
    typeof value === 'object' && value !== null && !Array.isArray(value);

const gcd = (a: number, b: number): number => {
    while (b !== 0) [a, b] = [b, a % b];
    return a;
};

export const isRatioRational = (value: unknown): value is RatioRational =>
    isRecord(value)
    && typeof value.numerator === 'number' && Number.isSafeInteger(value.numerator) && value.numerator >= 0
    && typeof value.denominator === 'number' && Number.isSafeInteger(value.denominator) && value.denominator > 0
    && gcd(value.numerator, value.denominator) === 1;

const isQuantity = (value: unknown): value is RatioQuantity =>
    isRecord(value) && typeof value.name === 'string' && value.name.trim().length > 0
    && typeof value.unit === 'string' && value.unit.trim().length > 0 && isRatioRational(value.value);

export const isRatioRelation = (data: unknown): data is RatioRelationProblem =>
    isRecord(data) && data.kind === 'ratio-relation' && isQuantity(data.antecedent)
    && isQuantity(data.consequent) && data.consequent.value.numerator > 0;

/** Cross products use integers so validation never rounds a rational witness. */
const productEquals = (left: RatioRational, right: RatioRational, product: RatioRational): boolean =>
    BigInt(left.numerator) * BigInt(right.numerator) * BigInt(product.denominator)
    === BigInt(product.numerator) * BigInt(left.denominator) * BigInt(right.denominator);

export const isUnitRateRelation = (data: unknown): data is UnitRateRelationProblem => {
    if (!isRecord(data) || data.kind !== 'unit-rate' || !['price', 'speed'].includes(String(data.context))
        || !isQuantity(data.antecedent) || !isQuantity(data.consequent)
        || data.consequent.value.numerator === 0 || !isRatioRational(data.unitRate)
        || !isRatioRational(data.scaleFactor) || data.scaleFactor.numerator === 0 || !isRecord(data.scaled)
        || !isRatioRational(data.scaled.antecedent) || !isRatioRational(data.scaled.consequent)) return false;
    return productEquals(data.unitRate, data.consequent.value, data.antecedent.value)
        && productEquals(data.antecedent.value, data.scaleFactor, data.scaled.antecedent)
        && productEquals(data.consequent.value, data.scaleFactor, data.scaled.consequent);
};

export const ratioNumber = ({numerator, denominator}: RatioRational): string =>
    denominator === 1 ? String(numerator) : `${numerator}/${denominator}`;

const singularUnit = (unit: string): string => {
    switch (unit) {
        case 'kilograms': return 'kilogram';
        case 'hours': return 'hour';
        case 'dollars': return 'dollar';
        case 'kilometers': return 'kilometer';
        case 'beads': return 'bead';
        case 'apples': return 'apple';
        case 'oranges': return 'orange';
        case 'cups': return 'cup';
        case 'liters': return 'liter';
        default: return unit;
    }
};

export const ratioMeasure = (value: RatioRational, unit: string): string =>
    `${ratioNumber(value)} ${value.numerator === value.denominator ? singularUnit(unit) : unit}`;

/** Count names carry their unit; measured materials need the unit stated explicitly. */
export const ratioQuantityMeasure = ({name, unit, value}: RatioQuantity): string => {
    if (name === unit || name.endsWith(` ${unit}`)) {
        const quantityName = value.numerator === value.denominator
            ? `${name.slice(0, -unit.length)}${singularUnit(unit)}` : name;
        return `${ratioNumber(value)} ${quantityName}`;
    }
    return `${ratioMeasure(value, unit)} of ${name}`;
};

export const rateStory = (data: UnitRateRelationProblem): string => data.context === 'price'
    ? `A purchase of ${ratioMeasure(data.consequent.value, data.consequent.unit)} of ${data.consequent.name} costs ${ratioMeasure(data.antecedent.value, data.antecedent.unit)}. The price per ${singularUnit(data.consequent.unit)} stays constant.`
    : `A traveler covers ${ratioMeasure(data.antecedent.value, data.antecedent.unit)} in ${ratioMeasure(data.consequent.value, data.consequent.unit)} at a constant speed.`;

export const rateInterpretation = (data: UnitRateRelationProblem): string => data.context === 'price'
    ? `For every 1 ${singularUnit(data.consequent.unit)} of ${data.consequent.name}, the cost is ${ratioMeasure(data.unitRate, data.antecedent.unit)}.`
    : `For every 1 ${singularUnit(data.consequent.unit)} of travel, the distance is ${ratioMeasure(data.unitRate, data.antecedent.unit)}.`;

export const rateRequest = (data: UnitRateRelationProblem): string => data.context === 'price'
    ? `Find the cost per ${singularUnit(data.consequent.unit)} and the cost of ${ratioMeasure(data.scaled.consequent, data.consequent.unit)} of ${data.consequent.name}.`
    : `Find the distance traveled per ${singularUnit(data.consequent.unit)} and the distance traveled in ${ratioMeasure(data.scaled.consequent, data.consequent.unit)}.`;

export const scaledRateAnswer = (data: UnitRateRelationProblem): string => data.context === 'price'
    ? `The cost of ${ratioMeasure(data.scaled.consequent, data.consequent.unit)} of ${data.consequent.name} is ${ratioMeasure(data.scaled.antecedent, data.antecedent.unit)}.`
    : `In ${ratioMeasure(data.scaled.consequent, data.consequent.unit)}, the traveler covers ${ratioMeasure(data.scaled.antecedent, data.antecedent.unit)}.`;
