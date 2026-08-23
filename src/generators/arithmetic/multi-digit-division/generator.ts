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

type DividendDigits = 1 | 2 | 3 | 4;

type DivisionCandidate = {
    dividend: number;
    divisor: number;
    quotient: number;
    remainder: number;
};

const hasNoZeroDigit = (value: number): boolean => !String(value).includes('0');

const buildCandidates = (dividendDigits: DividendDigits): DivisionCandidate[] => {
    const minimum = dividendDigits === 1 ? 1 : 10 ** (dividendDigits - 1);
    const maximum = 10 ** dividendDigits - 1;
    const candidates: DivisionCandidate[] = [];

    for (let dividend = minimum; dividend <= maximum; dividend++) {
        if (!hasNoZeroDigit(dividend)) continue;
        for (let divisor = 2; divisor <= 9; divisor++) {
            const quotient = Math.floor(dividend / divisor);
            const remainder = dividend % divisor;
            if (quotient <= 0 || remainder <= 0 || !hasNoZeroDigit(quotient)) continue;
            candidates.push({dividend, divisor, quotient, remainder});
        }
    }
    return candidates;
};

const candidatesByDividendDigits = new Map<DividendDigits, readonly DivisionCandidate[]>([
    [1, buildCandidates(1)],
    [2, buildCandidates(2)],
    [3, buildCandidates(3)],
    [4, buildCandidates(4)]
]);

const randomItem = <T>(items: readonly T[]): T =>
    items[Math.floor(random() * items.length)]!;

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
    ): ProblemStub<MultiDigitDivisionProblem> {
        validateConfigFields('multi-digit-division', config, [
            'divisorDigits',
            'dividendDigits'
        ]);

        if (config.divisorDigits !== 1) {
            throw new GeneratorValidationError(
                'multi-digit-division',
                `Unsupported divisor digit count "${config.divisorDigits}".`
            );
        }

        const dividendDigits = config.dividendDigits as DividendDigits;
        const candidates = candidatesByDividendDigits.get(dividendDigits);
        if (!candidates) {
            throw new GeneratorValidationError(
                'multi-digit-division',
                `Unsupported dividend digit count "${config.dividendDigits}".`
            );
        }

        const {dividend, divisor, quotient, remainder} = randomItem(candidates);
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
                divisorDigits: 1,
                dividendDecomposition,
                divisorDecomposition,
                partialQuotients
            }
        };
    }
}
