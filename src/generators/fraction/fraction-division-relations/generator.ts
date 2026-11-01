import {GeneratorValidationError, validateConfigFields} from '../../../lib/errors.ts';
import type {AbstractProblem, ProblemGenerator, ProblemStub} from '../../../types/ml-engine.ts';
import type {FractionDivisionContext, FractionDivisionRelationProblem, FractionQuotientValue} from '../../../types/problems.ts';
import {greatestCommonDivisor, pick, rational} from '../../ratio/helpers.ts';
import {FractionDivisionRelationsGeneratorSchema, type FractionDivisionRelationsGeneratorConfig} from './spec.ts';
import {random} from '../../../lib/random.ts';
import {divisionOperandProfiles, sampleDivisionOperands} from './operand-profiles.ts';
import {hasSharedDivisionRange, sampleDivisionRangeOperands} from './numeric-domain.ts';

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
        validateConfigFields('fraction-division-relations', config, ['operandProfile', 'groupCountProfile', 'withEquation', 'withMultiplication', 'range']);
        if (!Object.hasOwn(divisionOperandProfiles, config.operandProfile!)) {
            throw new GeneratorValidationError('fraction-division-relations', 'Unsupported original operand profile.');
        }
        if (!['zero', 'positive'].includes(config.groupCountProfile!)
            || config.operandProfile === 'fraction-by-integer-proper' && config.groupCountProfile === 'positive') {
            throw new GeneratorValidationError('fraction-division-relations', 'Choose a feasible complete-group count profile.');
        }
        const selectedProfile = divisionOperandProfiles[config.operandProfile!];
        if (typeof config.withEquation !== 'boolean' || typeof config.withMultiplication !== 'boolean') {
            throw new GeneratorValidationError('fraction-division-relations', 'Mathematical witness choices must be resolved booleans.');
        }
        const operandProfile = selectedProfile.kind;
        const sharedRange = hasSharedDivisionRange(config.operandProfile!, config.groupCountProfile!);
        if (!sharedRange
            && (config.range!.min !== 0 || config.range!.max !== Number.MAX_SAFE_INTEGER))
            throw new GeneratorValidationError('fraction-division-relations', 'Reciprocal-sensitive projections retain their original unlabelled range.');
        if (sharedRange && config.range!.max === Number.MAX_SAFE_INTEGER)
            throw new GeneratorValidationError('fraction-division-relations', 'Select a canonical range for the shared model role.');
        const {dividend, divisor} = sharedRange
            ? sampleDivisionRangeOperands(config.operandProfile!, config.groupCountProfile!, config.range!, random)
            : sampleDivisionOperands(config.operandProfile!, config.groupCountProfile!, random());
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
