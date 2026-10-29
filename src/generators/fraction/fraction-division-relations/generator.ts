import {GeneratorValidationError, validateConfigFields} from '../../../lib/errors.ts';
import type {AbstractProblem, ProblemGenerator, ProblemStub} from '../../../types/ml-engine.ts';
import type {FractionDivisionContext, FractionDivisionRelationProblem, FractionQuotientValue} from '../../../types/problems.ts';
import {greatestCommonDivisor, pick, randomInteger, rational} from '../../ratio/helpers.ts';
import {FractionDivisionRelationsGeneratorSchema, type FractionDivisionRelationsGeneratorConfig} from './spec.ts';
import {random} from '../../../lib/random.ts';

const fractionDenominators = [2, 3, 4, 6] as const;

const operandProfiles = {
    'fraction-by-fraction-proper': {kind: 'fraction-by-fraction', proper: true},
    'fraction-by-fraction-improper': {kind: 'fraction-by-fraction', proper: false},
    'fraction-by-integer-proper': {kind: 'fraction-by-integer', proper: true},
    'fraction-by-integer-improper': {kind: 'fraction-by-integer', proper: false},
    'integer-by-fraction-proper': {kind: 'integer-by-fraction', proper: true},
    'integer-by-fraction-improper': {kind: 'integer-by-fraction', proper: false}
} as const;

/** Retain the old denominator law conditional on the selected explicit operand's magnitude. */
function magnitudeDenominator(proper: boolean, dividend: boolean): number {
    const weights = fractionDenominators.map(denominator => {
        const total = 4 * denominator + (dividend ? 1 : 0);
        const properCount = denominator - (dividend ? 0 : 1);
        return (proper ? properCount : total - properCount) / total;
    });
    let position = random() * weights.reduce((sum, weight) => sum + weight, 0);
    return fractionDenominators.find((_, index) => (position -= weights[index]!) < 0)
        ?? fractionDenominators[fractionDenominators.length - 1];
}

function commonUnitModel(
    dividend: FractionQuotientValue, divisor: FractionQuotientValue
): FractionDivisionRelationProblem['model'] {
    const ticksPerWhole = dividend.denominator * divisor.denominator
        / greatestCommonDivisor(dividend.denominator, divisor.denominator);
    const dividendTicks = dividend.numerator * ticksPerWhole / dividend.denominator;
    const divisorTicks = divisor.numerator * ticksPerWhole / divisor.denominator;
    const completeGroups = Math.floor(dividendTicks / divisorTicks);
    const remainderTicks = dividendTicks % divisorTicks;
    const groupCount = completeGroups + (remainderTicks > 0 ? 1 : 0);
    const groups = Array.from({length: groupCount}, (_, index) => ({
        startTick: index * divisorTicks,
        endTick: (index + 1) * divisorTicks,
        filledTicks: Math.min(divisorTicks, dividendTicks - index * divisorTicks)
    }));
    return {
        kind: 'common-unit-groups', ticksPerWhole, dividendTicks, divisorTicks,
        completeGroups, remainderTicks,
        fractionalGroup: rational(remainderTicks, divisorTicks),
        coverageTicks: Math.max(ticksPerWhole, divisorTicks, groupCount * divisorTicks),
        groups
    };
}

function physicalContext(
    dividend: FractionQuotientValue, divisor: FractionQuotientValue, quotient: FractionQuotientValue
): FractionDivisionContext {
    const sideRatioNumerator = divisor.numerator * quotient.denominator;
    const sideRatioDenominator = quotient.numerator * divisor.denominator;
    const rectangleFits = dividend.numerator > 0
        && sideRatioNumerator <= 6 * sideRatioDenominator
        && sideRatioDenominator <= 6 * sideRatioNumerator;
    const kind = pick(rectangleFits
        ? ['sharing', 'measured-groups', 'rectangle'] as const
        : ['sharing', 'measured-groups'] as const);
    if (kind === 'rectangle') {
        return {kind, lengthUnit: 'meter', areaUnit: 'square meter', area: dividend, firstSide: divisor, secondSide: quotient};
    }
    if (kind === 'sharing') {
        return {
            kind, material: 'juice', measureUnit: 'liter', groupUnit: 'batch',
            totalMeasure: dividend, groupCount: divisor, measurePerGroup: quotient
        };
    }
    return {
        kind, material: 'juice', measureUnit: 'liter', groupUnit: 'serving',
        totalMeasure: dividend, groupCount: quotient, measurePerGroup: divisor
    };
}

export class FractionDivisionRelationsGenerator implements ProblemGenerator<
    FractionDivisionRelationProblem, FractionDivisionRelationsGeneratorConfig
> {
    type: AbstractProblem['type'] = 'fraction';
    schema = FractionDivisionRelationsGeneratorSchema;

    generate(config: FractionDivisionRelationsGeneratorConfig): ProblemStub<FractionDivisionRelationProblem> {
        validateConfigFields('fraction-division-relations', config, ['operandProfile', 'withEquation', 'withMultiplication']);
        if (!Object.hasOwn(operandProfiles, config.operandProfile!)) {
            throw new GeneratorValidationError('fraction-division-relations', 'Unsupported original operand profile.');
        }
        const selectedProfile = operandProfiles[config.operandProfile!];
        if (typeof config.withEquation !== 'boolean' || typeof config.withMultiplication !== 'boolean') {
            throw new GeneratorValidationError('fraction-division-relations', 'Mathematical witness choices must be resolved booleans.');
        }
        const {kind: operandProfile, proper} = selectedProfile;
        const classifyDividend = operandProfile !== 'integer-by-fraction';
        const firstDenominator = classifyDividend ? magnitudeDenominator(proper, true) : 1;
        const secondDenominator = operandProfile === 'fraction-by-integer' ? 1
            : classifyDividend ? pick(fractionDenominators) : magnitudeDenominator(proper, false);
        const dividend = {numerator: randomInteger(classifyDividend && !proper ? firstDenominator : 0,
            classifyDividend && proper ? firstDenominator - 1 : 4 * firstDenominator), denominator: firstDenominator};
        const divisor = {numerator: randomInteger(!classifyDividend && !proper ? secondDenominator : 1,
            !classifyDividend && proper ? secondDenominator - 1 : 4 * secondDenominator), denominator: secondDenominator};
        const reciprocal = {numerator: divisor.denominator, denominator: divisor.numerator};
        const reciprocalProduct = {
            numerator: dividend.numerator * reciprocal.numerator,
            denominator: dividend.denominator * reciprocal.denominator
        };
        const quotient = rational(reciprocalProduct.numerator, reciprocalProduct.denominator);
        const context = physicalContext(dividend, divisor, quotient);
        const firstFactor = context.kind === 'measured-groups' ? quotient : divisor;
        const secondFactor = context.kind === 'measured-groups' ? divisor : quotient;
        return {data: {
            kind: 'fraction-division-relation', operandProfile,
            dividend, divisor, quotient, reciprocal, reciprocalProduct,
            inverse: {quotientFactor: quotient, divisorFactor: divisor, reconstructedDividend: dividend},
            model: commonUnitModel(dividend, divisor), context,
            ...(config.withEquation ? {equationWitness: {firstFactor, secondFactor, product: dividend}} : {}),
            ...(config.withMultiplication ? {multiplicationWitness: {
                unreducedProduct: {
                    numerator: quotient.numerator * divisor.numerator,
                    denominator: quotient.denominator * divisor.denominator
                },
                reconstructedDividend: dividend
            }} : {})
        }};
    }
}
