import {random} from '../../lib/random.ts';
import {ProblemStub} from '../../types/ml-engine.ts';
import {ArithmeticOperation, ArithmeticWordProblemTwoStep, ArithmeticWordProblemLetterEquation, ArithmeticWordProblemRounding, ArithmeticWordProblemInterpretedRemainder} from '../../types/problems.ts';

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

const applyOperation = (left: number, right: number, operation: ArithmeticOperation): number => {
    if (operation === 'addition') return left + right;
    if (operation === 'subtraction') return left - right;
    if (operation === 'multiplication') return left * right;
    return left / right;
};

const randomInteger = (minimum: number, maximum: number): number | null => {
    if (minimum > maximum) return null;
    return minimum + Math.floor(random() * (maximum - minimum + 1));
};

const valuesInRange = (values: Values, minimum: number, maximum: number): boolean =>
    Object.values(values).every(value =>
        Number.isInteger(value) && value >= minimum && value <= maximum
    );

export function generateLegacyValues(
    operations: NamedOperations,
    minimum: number,
    maximum: number
): Values | null {
    for (let attempt = 0; attempt < 200; attempt++) {
        const operandLimit = Math.min(maximum, Math.max(12, minimum + 12));
        const num1 = randomInteger(minimum, operandLimit);
        const num2 = randomInteger(minimum, operandLimit);
        const num3 = randomInteger(minimum, operandLimit);
        if (num1 === null || num2 === null || num3 === null) return null;

        const intermediate = applyOperation(num1, num2, operations[0]);
        const answer = applyOperation(intermediate, num3, operations[1]);
        const values = {num1, num2, num3, intermediate, answer};
        if (valuesInRange(values, minimum, maximum)) return values;
    }

    return null;
}

export function generateGrade4Values(
    operations: NamedOperations,
    minimum: number,
    maximum: number,
    minimumAnswer = minimum
): Values | null {
    const operandMinimum = Math.max(2, minimum);
    const operandLimit = Math.min(maximum, 50);
    if (operandMinimum > operandLimit) return null;

    const draw = (limit = operandLimit): number | null => randomInteger(
        operandMinimum,
        Math.max(operandMinimum, limit)
    );
    const sequence = operations.join('-');

    for (let attempt = 0; attempt < 1_000; attempt++) {
        let values: Values | null = null;

        if (sequence === 'subtraction-subtraction') {
            const answer = draw();
            const num3 = draw();
            const num2 = draw();
            if (answer === null || num3 === null || num2 === null) return null;
            const intermediate = answer + num3;
            values = {num1: intermediate + num2, num2, num3, intermediate, answer};
        } else if (sequence === 'division-division') {
            const answer = draw();
            const num3 = draw(12);
            const num2 = draw(12);
            if (answer === null || num3 === null || num2 === null) return null;
            const intermediate = answer * num3;
            values = {num1: intermediate * num2, num2, num3, intermediate, answer};
        } else if (sequence === 'division-addition') {
            const intermediate = draw();
            const num2 = draw(12);
            const num3 = draw();
            if (intermediate === null || num2 === null || num3 === null) return null;
            values = {
                num1: intermediate * num2,
                num2,
                num3,
                intermediate,
                answer: intermediate + num3
            };
        } else if (sequence === 'division-subtraction') {
            const answer = draw();
            const num3 = draw();
            const num2 = draw(12);
            if (answer === null || num3 === null || num2 === null) return null;
            const intermediate = answer + num3;
            values = {
                num1: intermediate * num2,
                num2,
                num3,
                intermediate,
                answer
            };
        } else if (sequence === 'multiplication-division') {
            const num1 = draw();
            const factor = draw(10);
            const num3 = draw(10);
            if (num1 === null || factor === null || num3 === null) return null;
            const num2 = factor * num3;
            const intermediate = num1 * num2;
            values = {num1, num2, num3, intermediate, answer: num1 * factor};
        } else {
            const multiplicationLimit = sequence === 'multiplication-multiplication'
                ? Math.min(operandLimit, Math.max(operandMinimum, Math.floor(Math.cbrt(maximum))))
                : operandLimit;
            const num1 = draw(multiplicationLimit);
            const num2 = draw(multiplicationLimit);
            const num3 = draw(multiplicationLimit);
            if (num1 === null || num2 === null || num3 === null) return null;
            const intermediate = applyOperation(num1, num2, operations[0]);
            const answer = applyOperation(intermediate, num3, operations[1]);
            values = {num1, num2, num3, intermediate, answer};
        }

        if (valuesInRange(values, minimum, maximum) && values.answer >= minimumAnswer) return values;
    }

    return null;
}

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

export function buildLetterEquation(
    values: Values,
    operations: NamedOperations
): ArithmeticWordProblemLetterEquation {
    return {
        kind: 'letter-equation',
        operands: [values.num1, values.num2, values.num3],
        operations,
        intermediate: values.intermediate,
        answer: values.answer
    };
}

export function buildRounding(
    values: Values,
    operations: NamedOperations
): ArithmeticWordProblemRounding {
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
