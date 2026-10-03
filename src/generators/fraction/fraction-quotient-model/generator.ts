import {GeneratorValidationError, validateConfigFields} from '../../../lib/errors.ts';
import {random} from '../../../lib/random.ts';
import type {AbstractProblem, ProblemGenerator, ProblemStub} from '../../../types/ml-engine.ts';
import type {FractionQuotientProblem, FractionQuotientValue} from '../../../types/problems.ts';
import {
    FractionQuotientModelGeneratorConfig,
    FractionQuotientModelGeneratorSchema
} from './spec.ts';

type Profile = FractionQuotientModelGeneratorConfig['relationProfile'];
type Common = Pick<FractionQuotientProblem,
    'kind' | 'dividend' | 'divisor' | 'quotient' | 'inverse' | 'equationWitness' | 'multiplicationWitness'>;

const integer = (minimum: number, maximum: number): number =>
    minimum + Math.floor(random() * (maximum - minimum + 1));

const value = (numerator: number, denominator = 1): FractionQuotientValue =>
    ({numerator, denominator});

const material = (): 'ribbon' | 'rope' => random() < 0.5 ? 'ribbon' : 'rope';

/** The optional records are mathematical equalities; neither selects a learner task. */
function common(
    dividend: FractionQuotientValue,
    divisor: FractionQuotientValue,
    quotient: FractionQuotientValue,
    relation: 'sharing' | 'group-count',
    withEquation: boolean,
    withMultiplication: boolean
): Common {
    const inverse = {
        quotientFactor: quotient,
        divisorFactor: divisor,
        reconstructedDividend: dividend
    };
    const equationWitness = withEquation ? {
        totalMeasure: dividend,
        groupCount: relation === 'sharing' ? divisor : quotient,
        measurePerGroup: relation === 'sharing' ? quotient : divisor
    } : undefined;
    const multiplicationWitness = withMultiplication ? {
        unreducedProduct: value(
            quotient.numerator * divisor.numerator,
            quotient.denominator * divisor.denominator
        ),
        reconstructedDividend: dividend
    } : undefined;
    return {
        kind: 'fraction-quotient', dividend, divisor, quotient, inverse,
        ...(equationWitness ? {equationWitness} : {}),
        ...(multiplicationWitness ? {multiplicationWitness} : {})
    };
}

function wholeByWhole(withEquation: boolean, asNotation: boolean): FractionQuotientProblem {
    const wholeUnitCount = integer(asNotation ? 1 : 0, 6);
    const recipientCount = integer(asNotation ? 2 : 1, 6);
    return {
        ...common(value(wholeUnitCount), value(recipientCount),
            value(wholeUnitCount, recipientCount), 'sharing', withEquation, false),
        orientation: 'whole-by-whole',
        model: {
            kind: 'equal-sharing', wholeUnitCount, recipientCount,
            partsPerWhole: recipientCount,
            totalParts: wholeUnitCount * recipientCount,
            partsPerRecipient: wholeUnitCount
        },
        story: {material: material(), measureUnit: 'meter', recipientUnit: 'person'}
    };
}

function unitFractionByWhole(withEquation: boolean, withMultiplication: boolean): FractionQuotientProblem {
    const wholePartitionCount = integer(2, 6);
    const recipientCount = integer(2, 6);
    return {
        ...common(value(1, wholePartitionCount), value(recipientCount),
            value(1, wholePartitionCount * recipientCount),
            'sharing', withEquation, withMultiplication),
        orientation: 'unit-fraction-by-whole',
        model: {
            kind: 'unit-part-sharing', wholePartitionCount, recipientCount,
            refinedPartitionCount: wholePartitionCount * recipientCount,
            sharedFineParts: recipientCount
        },
        story: {material: material(), measureUnit: 'meter', recipientUnit: 'person'}
    };
}

function wholeByUnitFraction(withEquation: boolean, withMultiplication: boolean): FractionQuotientProblem {
    const wholeUnitCount = integer(0, 6);
    const partsPerWhole = integer(2, 6);
    const groupCount = wholeUnitCount * partsPerWhole;
    return {
        ...common(value(wholeUnitCount), value(1, partsPerWhole),
            value(groupCount), 'group-count', withEquation, withMultiplication),
        orientation: 'whole-by-unit-fraction',
        model: {kind: 'unit-part-group-count', wholeUnitCount, partsPerWhole, groupCount},
        story: {material: material(), measureUnit: 'meter', groupUnit: 'piece'}
    };
}

const PROFILE_VALUES = [
    'fraction-as-quotient', 'whole-sharing-equation',
    'unit-dividend-basic', 'unit-dividend-inverse', 'unit-dividend-equation',
    'unit-divisor-basic', 'unit-divisor-inverse', 'unit-divisor-equation'
] as const satisfies readonly Profile[];

export class FractionQuotientModelGenerator implements ProblemGenerator<
    FractionQuotientProblem,
    FractionQuotientModelGeneratorConfig
> {
    type: AbstractProblem['type'] = 'fraction';
    schema = FractionQuotientModelGeneratorSchema;

    generate(config: FractionQuotientModelGeneratorConfig): ProblemStub<FractionQuotientProblem> {
        validateConfigFields('fraction-quotient-model', config, ['relationProfile']);
        if (!config.relationProfile || !PROFILE_VALUES.includes(config.relationProfile)) {
            throw new GeneratorValidationError('fraction-quotient-model',
                `Unsupported relation profile "${config.relationProfile}".`);
        }
        switch (config.relationProfile) {
            case 'fraction-as-quotient': return {data: wholeByWhole(false, true)};
            case 'whole-sharing-equation': return {data: wholeByWhole(true, false)};
            case 'unit-dividend-basic': return {data: unitFractionByWhole(false, false)};
            case 'unit-dividend-inverse': return {data: unitFractionByWhole(false, true)};
            case 'unit-dividend-equation': return {data: unitFractionByWhole(true, false)};
            case 'unit-divisor-basic': return {data: wholeByUnitFraction(false, false)};
            case 'unit-divisor-inverse': return {data: wholeByUnitFraction(false, true)};
            case 'unit-divisor-equation': return {data: wholeByUnitFraction(true, false)};
        }
    }
}
