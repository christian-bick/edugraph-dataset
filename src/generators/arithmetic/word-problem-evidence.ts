import {random} from '../../lib/random.ts';
import {ProblemStub} from '../../types/ml-engine.ts';
import {ArithmeticOperation, ArithmeticWordProblemTwoStep, ArithmeticWordProblemRounding, ArithmeticWordProblemInterpretedRemainder} from '../../types/problems.ts';

type Values = Pick<
    ArithmeticWordProblemTwoStep,
    'num1' | 'num2' | 'num3' | 'intermediate' | 'answer'
>;

type NamedOperations = readonly [ArithmeticOperation, ArithmeticOperation];

const MAX_GRADE4_VALUE = 999_999;

type RoundingPlace = ArithmeticWordProblemRounding['roundingPlace'];

const roundingPlaceFor = (value: number): RoundingPlace => {
    const exponent = Math.max(1, Math.min(5, Math.floor(Math.log10(Math.max(1, Math.abs(value))))));
    return 10 ** exponent as RoundingPlace;
};

const roundTo = (value: number, place: RoundingPlace): number =>
    Math.round(value / place) * place;

const randomInteger = (minimum: number, maximum: number): number | null => {
    if (minimum > maximum) return null;
    return minimum + Math.floor(random() * (maximum - minimum + 1));
};

export function generateInterpretedRemainder(
    minimum: number,
    requestedMaximum: number
): ProblemStub<ArithmeticWordProblemInterpretedRemainder> | null {
    const maximum = Math.min(MAX_GRADE4_VALUE, requestedMaximum);
    const divisor = randomInteger(Math.max(2, minimum), Math.min(12, maximum - 1));
    if (divisor === null) return null;
    const largestQuotient = Math.min(100, Math.floor((maximum - 1) / divisor));
    const quotient = randomInteger(Math.max(2, minimum), largestQuotient);
    const remainder = randomInteger(1, divisor - 1);
    if (quotient === null || remainder === null) return null;

    const dividend = divisor * quotient + remainder;
    if (dividend > maximum) return null;
    return {data: {
        kind: 'interpreted-remainder' as const,
        dividend,
        divisor,
        quotient,
        remainder
    }};
}

export function buildRounding(
    values: Values,
    operations: NamedOperations
): Omit<ArithmeticWordProblemRounding, 'numberDomain' | 'proposal'> {
    const roundingPlace = roundingPlaceFor(values.answer);
    return {
        kind: 'rounding',
        operands: [values.num1, values.num2, values.num3],
        operations,
        intermediate: values.intermediate,
        answer: values.answer,
        roundingPlace,
        roundedAnswer: roundTo(values.answer, roundingPlace)
    };
}
