import {GeneratorValidationError, validateConfigFields} from '../../../lib/errors.ts';
import {random} from '../../../lib/random.ts';
import type {AbstractProblem, ProblemGenerator, ProblemStub} from '../../../types/ml-engine.ts';
import type {StandardDivisionProblem, StandardDivisionStep} from '../../../types/problems.ts';
import {StandardAlgorithmDivisionGeneratorSchema, type StandardAlgorithmDivisionGeneratorConfig} from './spec.ts';

const generatorId = 'standard-algorithm-division';
const randomInteger = (minimum: number, maximum: number): number =>
    minimum + Math.floor(random() * (maximum - minimum + 1));

/** Build the exact positional trace, including zero quotient places and their subtraction. */
export const buildStandardDivisionProblem = (dividend: number, divisor: number): StandardDivisionProblem => {
    if (!Number.isSafeInteger(dividend) || dividend < 10
        || !Number.isSafeInteger(divisor) || divisor < 1) {
        throw new GeneratorValidationError(generatorId,
            'Division needs a safe multi-digit whole dividend and a positive safe whole divisor.');
    }

    const dividendDigits = String(dividend).split('').map(Number);
    let firstColumn = 0;
    let prefix = dividendDigits[0]!;
    while (prefix < divisor && firstColumn < dividendDigits.length - 1) {
        firstColumn++;
        prefix = 10 * prefix + dividendDigits[firstColumn]!;
    }

    const steps: StandardDivisionStep[] = [];
    let previousRemainder = 0;
    for (let columnIndex = firstColumn; columnIndex < dividendDigits.length; columnIndex++) {
        const broughtDownDigits = columnIndex === firstColumn
            ? dividendDigits.slice(0, firstColumn + 1)
            : [dividendDigits[columnIndex]!];
        const partialDividend = columnIndex === firstColumn
            ? prefix
            : 10 * previousRemainder + dividendDigits[columnIndex]!;
        const quotientDigit = Math.floor(partialDividend / divisor);
        const product = divisor * quotientDigit;
        const remainder = partialDividend - product;
        const nextColumn = columnIndex + 1;
        steps.push({
            columnIndex,
            placeValue: 10 ** (dividendDigits.length - 1 - columnIndex),
            previousRemainder,
            broughtDownDigits,
            partialDividend,
            quotientDigit,
            product,
            remainder,
            ...(nextColumn < dividendDigits.length ? {nextBringDown: {
                sourceColumn: nextColumn,
                digit: dividendDigits[nextColumn]!,
                partialDividend: 10 * remainder + dividendDigits[nextColumn]!
            }} : {})
        });
        previousRemainder = remainder;
    }

    const quotientDigits = steps.map(step => step.quotientDigit);
    return {
        kind: 'whole-number-standard-division',
        base: 10,
        dividend,
        divisor,
        quotient: quotientDigits.reduce((value, digit) => 10 * value + digit, 0),
        remainder: previousRemainder,
        dividendDigits,
        quotientStartColumn: firstColumn,
        quotientDigits,
        steps
    };
};

/** Vary concrete arithmetic while the configured divisor width and magnitude stay fixed. */
const sampleDividend = (divisor: number, ceiling: number): number => {
    const variation = randomInteger(0, 3);
    if (variation === 0 && divisor > 10) return randomInteger(10, divisor - 1);
    if (variation === 1) {
        return divisor * randomInteger(Math.ceil(10 / divisor), Math.floor(ceiling / divisor));
    }
    if (variation === 2) {
        const quotients = [10, 20, 30, 100, 101, 102, 200, 201, 1000, 1001, 1010]
            .filter(quotient => divisor * quotient <= ceiling);
        const quotient = quotients[randomInteger(0, quotients.length - 1)]!;
        const product = divisor * quotient;
        return product + randomInteger(0, Math.min(divisor - 1, ceiling - product));
    }
    return randomInteger(10, ceiling);
};

export class StandardAlgorithmDivisionGenerator implements ProblemGenerator<
    StandardDivisionProblem, StandardAlgorithmDivisionGeneratorConfig
> {
    type: AbstractProblem['type'] = 'arithmetic';
    schema = StandardAlgorithmDivisionGeneratorSchema;

    generate(config: StandardAlgorithmDivisionGeneratorConfig): ProblemStub<StandardDivisionProblem> {
        validateConfigFields(generatorId, config, ['range', 'divisorDigits']);
        const range = config.range!;
        if (typeof range !== 'object' || range === null || range.min !== 0
            || ![10000, 100000, Number.MAX_SAFE_INTEGER].includes(range.max)) {
            throw new GeneratorValidationError(generatorId,
                'Range must start at zero with bound 10000, 100000, or the unbounded resolver sentinel.');
        }
        if (config.divisorDigits !== 1 && config.divisorDigits !== 2 && config.divisorDigits !== 3) {
            throw new GeneratorValidationError(generatorId, 'Divisor digit count must be 1, 2, or 3.');
        }

        const ceiling = range.max === Number.MAX_SAFE_INTEGER ? 99999 : range.max - 1;
        const divisor = randomInteger(10 ** (config.divisorDigits - 1), 10 ** config.divisorDigits - 1);
        return {data: buildStandardDivisionProblem(sampleDividend(divisor, ceiling), divisor)};
    }
}
