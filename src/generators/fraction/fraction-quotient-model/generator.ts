import {GeneratorValidationError, validateConfigFields} from '../../../lib/errors.ts';
import {random} from '../../../lib/random.ts';
import type {AbstractProblem, ProblemGenerator, ProblemStub} from '../../../types/ml-engine.ts';
import type {FractionQuotientProblem, FractionQuotientValue} from '../../../types/problems.ts';
import {
    FractionQuotientModelGeneratorConfig,
    FractionQuotientModelGeneratorSchema
} from './spec.ts';
import {numericProfiles, type QuotientNumericProfile} from './numeric-profiles.ts';
import {quotientRangePairs} from './numeric-domain.ts';
import type {CanonicalNumericRange} from '../../../lib/canonical-numeric-range.ts';

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

function wholeByWhole(withEquation: boolean, numericProfile: QuotientNumericProfile, range: CanonicalNumericRange): FractionQuotientProblem {
    const pairs = quotientRangePairs(withEquation ? 'whole-sharing' : 'notation', numericProfile, range);
    if (!pairs.length) throw new GeneratorValidationError('fraction-quotient-model', 'No sharing pairs support this numeric range.');
    const [wholeUnitCount, recipientCount] = pairs[integer(0, pairs.length - 1)]!;
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

function wholeByUnitFraction(withEquation: boolean, withMultiplication: boolean,
    numericProfile: QuotientNumericProfile, range: CanonicalNumericRange): FractionQuotientProblem {
    const pairs = quotientRangePairs('unit-divisor', numericProfile, range);
    if (!pairs.length) throw new GeneratorValidationError('fraction-quotient-model', 'No group-count pairs support this numeric range.');
    const [wholeUnitCount, partsPerWhole] = pairs[integer(0, pairs.length - 1)]!;
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
    'unit-divisor-basic', 'unit-divisor-inverse', 'unit-divisor-equation'
] as const satisfies readonly Profile[];

export class FractionQuotientModelGenerator implements ProblemGenerator<
    FractionQuotientProblem,
    FractionQuotientModelGeneratorConfig
> {
    type: AbstractProblem['type'] = 'fraction';
    schema = FractionQuotientModelGeneratorSchema;

    generate(config: FractionQuotientModelGeneratorConfig): ProblemStub<FractionQuotientProblem> {
        validateConfigFields('fraction-quotient-model', config, ['relationProfile', 'numericProfile', 'range']);
        if (!config.relationProfile || !PROFILE_VALUES.includes(config.relationProfile)) {
            throw new GeneratorValidationError('fraction-quotient-model',
                `Unsupported relation profile "${config.relationProfile}".`);
        }
        const numericProfile = config.numericProfile!;
        if (!numericProfiles.some(([, value]) => value === numericProfile)
            || (config.relationProfile === 'fraction-as-quotient'
                ? numericProfile !== 'proper' && numericProfile !== 'improper'
                : numericProfile !== 'zero' && numericProfile !== 'nonzero')) {
            throw new GeneratorValidationError('fraction-quotient-model',
                `Numeric profile "${numericProfile}" is incompatible with "${config.relationProfile}".`);
        }
        switch (config.relationProfile) {
            case 'fraction-as-quotient': return {data: wholeByWhole(false, numericProfile, config.range!)};
            case 'whole-sharing-equation': return {data: wholeByWhole(true, numericProfile, config.range!)};
            case 'unit-divisor-basic': return {data: wholeByUnitFraction(false, false, numericProfile, config.range!)};
            case 'unit-divisor-inverse': return {data: wholeByUnitFraction(false, true, numericProfile, config.range!)};
            case 'unit-divisor-equation': return {data: wholeByUnitFraction(true, false, numericProfile, config.range!)};
        }
    }
}
