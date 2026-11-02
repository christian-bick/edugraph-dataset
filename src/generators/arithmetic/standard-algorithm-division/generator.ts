import {GeneratorValidationError, validateConfigFields} from '../../../lib/errors.ts';
import {random} from '../../../lib/random.ts';
import type {AbstractProblem, ProblemGenerator, ProblemStub} from '../../../types/ml-engine.ts';
import type {StandardDivisionProblem, StandardDivisionStep} from '../../../types/problems.ts';
import {StandardAlgorithmDivisionGeneratorSchema, type StandardAlgorithmDivisionGeneratorConfig} from './spec.ts';
import {standardDivisionDomain, standardDivisionFrame} from './domain.ts';

const generatorId = 'standard-algorithm-division';

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

export class StandardAlgorithmDivisionGenerator implements ProblemGenerator<
    StandardDivisionProblem, StandardAlgorithmDivisionGeneratorConfig
> {
    type: AbstractProblem['type'] = 'arithmetic';
    schema = StandardAlgorithmDivisionGeneratorSchema;

    generate(config: StandardAlgorithmDivisionGeneratorConfig): ProblemStub<StandardDivisionProblem> | null {
        validateConfigFields(generatorId, config, ['range', 'divisorDigits', 'requireZero']);
        const domain = standardDivisionDomain(config.divisorDigits!, config.requireZero!, config.range!);
        if (!domain.count) throw new GeneratorValidationError(generatorId, 'The selected canonical division profile is empty.');
        const frame = standardDivisionFrame(domain, random() * domain.weight);
        return {data: buildStandardDivisionProblem(frame.dividend, frame.divisor)};
    }
}
