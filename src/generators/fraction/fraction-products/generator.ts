import {GeneratorValidationError, validateConfigFields} from '../../../lib/errors.ts';
import {random} from '../../../lib/random.ts';
import type {AbstractProblem, ProblemGenerator, ProblemStub} from '../../../types/ml-engine.ts';
import type {
    FractionProductFractionOperand,
    FractionProductMixedOperand,
    FractionProductProblem,
    FractionProductValue
} from '../../../types/problems.ts';
import {
    FractionProductsGeneratorSchema
} from './spec.ts';
import type {FractionProductsGeneratorConfig} from './spec.ts';

type ProductProfile = NonNullable<FractionProductsGeneratorConfig['productProfile']>;
type Common = Pick<FractionProductProblem,
    'kind' | 'sharedWhole' | 'multiplierValue' | 'quantityValue' | 'product'
    | 'context' | 'partition' | 'equationWitness'>;

const integer = (minimum: number, maximum: number): number =>
    minimum + Math.floor(random() * (maximum - minimum + 1));

const value = (numerator: number, denominator: number): FractionProductValue =>
    ({numerator, denominator});

const fractionMultiplier = (): FractionProductFractionOperand => {
    const denominator = integer(2, 6);
    const numerator = random() < 0.5
        ? integer(1, denominator - 1)
        : (() => {
            const candidate = integer(denominator + 1, 3 * denominator - 1);
            return candidate === 2 * denominator ? candidate + 1 : candidate;
        })();
    return {form: 'fraction', numerator, denominator};
};

const fractionalQuantity = (): FractionProductFractionOperand => {
    const denominator = integer(2, 6);
    const candidates = Array.from({length: 3 * denominator - 1}, (_, index) => index + 1)
        .filter(numerator => numerator % denominator !== 0);
    return {form: 'fraction', numerator: candidates[integer(0, candidates.length - 1)]!, denominator};
};

const wholeQuantity = (): FractionProductFractionOperand =>
    ({form: 'fraction', numerator: integer(1, 6), denominator: 1});

const mixedOperand = (maximumWhole: number): FractionProductMixedOperand => {
    const whole = integer(1, maximumWhole);
    const denominator = integer(2, 6);
    const fractionNumerator = integer(1, denominator - 1);
    return {
        form: 'mixed', whole, fractionNumerator, denominator,
        improperNumerator: whole * denominator + fractionNumerator
    };
};

/** Exact partition of the entire measured quantity q into b equal pieces per copy. */
function common(
    multiplierValue: FractionProductValue,
    quantityValue: FractionProductValue,
    includeEquation: boolean
): Common {
    const a = multiplierValue.numerator;
    const b = multiplierValue.denominator;
    const q = quantityValue.numerator;
    const qDenominator = quantityValue.denominator;
    const product = value(a * q, b * qDenominator);
    const context = {
        material: random() < 0.5 ? 'ribbon' : 'rope',
        measureUnit: 'meter'
    } as const;
    return {
        kind: 'fraction-product',
        sharedWhole: 1,
        multiplierValue,
        quantityValue,
        product,
        context,
        partition: {
            equalPartsPerCopy: b,
            selectedPartCount: a,
            copyCount: Math.ceil(a / b),
            availablePartCount: Math.ceil(a / b) * b,
            onePartValue: value(q, qDenominator * b),
            scaledQuantity: value(a * q, qDenominator)
        },
        ...(includeEquation ? {equationWitness: {
            factor: multiplierValue,
            referenceMeasure: quantityValue,
            productMeasure: product,
            measureUnit: 'meter' as const
        }} : {})
    };
}

function sample(profile: ProductProfile): FractionProductProblem {
    if (profile === 'mixed-equation') {
        const multiplier = mixedOperand(2);
        const quantity = mixedOperand(3);
        return {
            ...common(
                value(multiplier.improperNumerator, multiplier.denominator),
                value(quantity.improperNumerator, quantity.denominator),
                true
            ),
            operandForm: 'mixed-numbers', multiplier, quantity
        };
    }

    const multiplier = fractionMultiplier();
    const quantity = profile === 'fraction-partition' && random() < 0.5
        ? wholeQuantity()
        : fractionalQuantity();
    return {
        ...common(value(multiplier.numerator, multiplier.denominator),
            value(quantity.numerator, quantity.denominator),
            profile === 'fraction-equation'),
        operandForm: 'fractions', multiplier, quantity
    };
}

export class FractionProductsGenerator implements ProblemGenerator<
    FractionProductProblem,
    FractionProductsGeneratorConfig
> {
    type: AbstractProblem['type'] = 'fraction';
    schema = FractionProductsGeneratorSchema;

    generate(config: FractionProductsGeneratorConfig): ProblemStub<FractionProductProblem> {
        validateConfigFields('fraction-products', config, ['productProfile']);
        switch (config.productProfile) {
            case 'fraction-partition':
            case 'fraction-equation':
            case 'mixed-equation':
                return {data: sample(config.productProfile)};
            default:
                throw new GeneratorValidationError('fraction-products',
                    'Unsupported product profile.');
        }
    }
}
