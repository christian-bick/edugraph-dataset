import {GeneratorValidationError, validateConfigFields} from '../../../lib/errors.ts';
import {random} from '../../../lib/random.ts';
import {AbstractProblem, ProblemGenerator, ProblemStub} from '../../../types/ml-engine.ts';
import {
    DivisionOperandDecomposition,
    DivisionPartialQuotientStep,
    DivisionPlaceValuePart,
    MultiDigitDivisionProblem
} from '../../../types/problems.ts';
import {
    MultiDigitDivisionGeneratorConfig,
    MultiDigitDivisionGeneratorSchema
} from './spec.ts';
import {partialQuotientDomain, partialQuotientFrame} from './domain.ts';

const buildDecomposition = (operand: number): DivisionOperandDecomposition => {
    const digits = String(operand).split('').map(Number);
    const parts = digits.map((digit, index): DivisionPlaceValuePart => {
        const placeValue = (10 ** (digits.length - index - 1)) as DivisionPlaceValuePart['placeValue'];
        return {
            digit,
            placeValue,
            value: digit * placeValue
        };
    });

    return {operand, parts};
};

const buildPartialQuotients = (
    dividend: number,
    divisor: number,
    quotient: number
): DivisionPartialQuotientStep[] => {
    const quotientDigits = String(quotient).split('').map(Number);
    let remaining = dividend;

    return quotientDigits.map((quotientDigit, index) => {
        const placeValue = (10 ** (quotientDigits.length - index - 1)) as DivisionPartialQuotientStep['placeValue'];
        const partialQuotient = quotientDigit * placeValue;
        const partialProduct = divisor * partialQuotient;
        const remainingBefore = remaining;
        const remainingAfter = remainingBefore - partialProduct;
        remaining = remainingAfter;

        return {
            quotientDigit,
            placeValue,
            partialQuotient,
            remainingBefore,
            partialProduct,
            remainingAfter
        };
    });
};

export class MultiDigitDivisionGenerator implements ProblemGenerator<
    MultiDigitDivisionProblem,
    MultiDigitDivisionGeneratorConfig
> {
    type: AbstractProblem['type'] = 'arithmetic';
    schema = MultiDigitDivisionGeneratorSchema;

    generate(
        config: MultiDigitDivisionGeneratorConfig
    ): ProblemStub<MultiDigitDivisionProblem> | null {
        validateConfigFields('multi-digit-division', config, [
            'divisorDigits',
            'dividendDigits',
            'requireZero',
            'range'
        ]);

        if (typeof config.requireZero !== 'boolean' || config.divisorDigits === 1 && config.requireZero) {
            throw new GeneratorValidationError('multi-digit-division', 'Expected a feasible declared zero-occurrence profile.');
        }

        if (config.divisorDigits !== 1 && config.divisorDigits !== 2) {
            throw new GeneratorValidationError(
                'multi-digit-division',
                `Unsupported divisor digit count "${config.divisorDigits}".`
            );
        }

        const dividendDigits = config.dividendDigits as 1 | 2 | 3 | 4;
        if (![1, 2, 3, 4].includes(dividendDigits)) {
            throw new GeneratorValidationError(
                'multi-digit-division',
                `Unsupported dividend digit count "${config.dividendDigits}".`
            );
        }

        if (config.divisorDigits === 2 && dividendDigits === 1) {
            throw new GeneratorValidationError(
                'multi-digit-division',
                'A two-digit divisor requires a dividend of at least two digits.'
            );
        }

        const domain = partialQuotientDomain(dividendDigits, config.divisorDigits, config.requireZero, config.range!);
        if (!domain.count) return null;
        const candidate = partialQuotientFrame(domain, random() * domain.weight);
        const {dividend, divisor, quotient, remainder} = candidate;
        const dividendDecomposition = buildDecomposition(dividend);
        const divisorDecomposition = buildDecomposition(divisor);
        const partialQuotients = buildPartialQuotients(dividend, divisor, quotient);

        return {
            data: {
                task: 'multi-digit-division',
                dividend,
                divisor,
                quotient,
                remainder,
                dividendDigits,
                divisorDigits: config.divisorDigits,
                dividendDecomposition,
                divisorDecomposition,
                partialQuotients
            }
        };
    }
}
