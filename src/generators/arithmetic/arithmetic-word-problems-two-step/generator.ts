import {Area} from 'edugraph-ts';
import {validateConfigFields} from '../../../lib/errors.ts';
import {random} from '../../../lib/random.ts';
import {AbstractProblem, ProblemGenerator, ProblemStub} from '../../../types/ml-engine.ts';
import {
    ArithmeticOperation,
    ArithmeticWordProblemInterpretedRemainder,
    ArithmeticWordProblemLetterEquation,
    ArithmeticWordProblemMultistep,
    ArithmeticWordProblemReasonableness,
    ArithmeticWordProblemTwoStep
} from '../../../types/problems.ts';
import {
    ArithmeticWordProblemsTwoStepGeneratorConfig,
    ArithmeticWordProblemsTwoStepGeneratorSchema
} from './spec.ts';
import {operationNames, TwoStepOperationLabels} from '../helpers.ts';

type Values = Pick<
    ArithmeticWordProblemTwoStep,
    'num1' | 'num2' | 'num3' | 'intermediate' | 'answer'
>;

type NamedOperations = readonly [ArithmeticOperation, ArithmeticOperation];

const MAX_TWO_STEP_VALUE = 100;
const MAX_GRADE4_VALUE = 999_999;

type ReasonablenessRoundingPlace = ArithmeticWordProblemReasonableness['roundingPlace'];

const roundingPlaceFor = (value: number): ReasonablenessRoundingPlace => {
    const exponent = Math.max(1, Math.min(5, Math.floor(Math.log10(Math.max(1, Math.abs(value))))));
    return 10 ** exponent as ReasonablenessRoundingPlace;
};

const roundTo = (value: number, place: ReasonablenessRoundingPlace): number =>
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

export class ArithmeticWordProblemsTwoStepGenerator implements ProblemGenerator<
    ArithmeticWordProblemMultistep,
    ArithmeticWordProblemsTwoStepGeneratorConfig
> {
    type: AbstractProblem['type'] = 'arithmetic';
    schema = ArithmeticWordProblemsTwoStepGeneratorSchema;

    generate(
        config: ArithmeticWordProblemsTwoStepGeneratorConfig
    ): ProblemStub<ArithmeticWordProblemMultistep> | null {
        validateConfigFields('arithmetic-word-problems-two-step', config, [
            'task',
            'operations',
            'range'
        ]);

        const operations = config.operations!;
        if (operations === 'unsupported') return null;

        const minimum = Math.max(1, Math.ceil(config.range!.min));
        const requestedMaximum = Math.floor(config.range!.max);
        if (minimum > requestedMaximum) return null;

        const namedOperations: NamedOperations = [
            operationNames[operations[0]],
            operationNames[operations[1]]
        ];

        if (config.task === 'interpreted-remainder') {
            return this.generateInterpretedRemainder(namedOperations, minimum, requestedMaximum);
        }

        const maximum = config.task === 'two-step'
            ? Math.min(MAX_TWO_STEP_VALUE, requestedMaximum)
            : Math.min(MAX_GRADE4_VALUE, requestedMaximum);
        if (minimum > maximum) return null;

        const values = config.task === 'two-step'
            ? this.generateLegacyValues(operations, minimum, maximum)
            : this.generateGrade4Values(namedOperations, minimum, maximum);
        if (!values) return null;

        if (config.task === 'letter-equation') {
            return {data: this.buildLetterEquation(values, namedOperations)};
        }
        if (config.task === 'reasonableness') {
            const reasonableness = this.buildReasonableness(values, namedOperations, maximum);
            return reasonableness ? {data: reasonableness} : null;
        }

        return {
            tags: [],
            data: {
                kind: 'two-step',
                ...values,
                operations: namedOperations
            }
        };
    }

    private generateLegacyValues(
        operations: TwoStepOperationLabels,
        minimum: number,
        maximum: number
    ): Values | null {
        const apply = (left: number, right: number, operation: string): number => {
            if (operation === Area.Addition) return left + right;
            if (operation === Area.Subtraction) return left - right;
            if (operation === Area.Multiplication) return left * right;
            return left / right;
        };

        for (let attempt = 0; attempt < 200; attempt++) {
            const operandLimit = Math.min(maximum, Math.max(12, minimum + 12));
            const num1 = randomInteger(minimum, operandLimit);
            const num2 = randomInteger(minimum, operandLimit);
            const num3 = randomInteger(minimum, operandLimit);
            if (num1 === null || num2 === null || num3 === null) return null;

            const intermediate = apply(num1, num2, operations[0]);
            const answer = apply(intermediate, num3, operations[1]);
            const values = {num1, num2, num3, intermediate, answer};
            if (valuesInRange(values, minimum, maximum)) return values;
        }

        return null;
    }

    private generateGrade4Values(
        operations: NamedOperations,
        minimum: number,
        maximum: number
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

            if (valuesInRange(values, minimum, maximum)) return values;
        }

        return null;
    }

    private generateInterpretedRemainder(
        operations: NamedOperations,
        minimum: number,
        requestedMaximum: number
    ): ProblemStub<ArithmeticWordProblemInterpretedRemainder> | null {
        if (!operations.includes('division')) return null;
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

    private buildLetterEquation(
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

    private buildReasonableness(
        values: Values,
        operations: NamedOperations,
        maximum: number
    ): ArithmeticWordProblemReasonableness | null {
        const roundingPlace = roundingPlaceFor(values.answer);
        const roundedExactAnswer = roundTo(values.answer, roundingPlace);
        const shouldBeReasonable = random() < 0.5;
        const fineStep = Math.max(1, roundingPlace / 10);
        const offsets = shouldBeReasonable
            ? [fineStep, -fineStep, 2 * fineStep, -2 * fineStep, 1, -1]
            : [roundingPlace, -roundingPlace, 2 * roundingPlace, -2 * roundingPlace];
        const candidates = offsets
            .map(offset => values.answer + offset)
            .filter(candidate => {
                if (!Number.isInteger(candidate) || candidate < 1 || candidate > maximum) return false;
                return (roundTo(candidate, roundingPlace) === roundedExactAnswer) === shouldBeReasonable;
            });
        if (candidates.length === 0) return null;

        const proposedAnswer = candidates[Math.floor(random() * candidates.length)];
        const roundedProposedAnswer = roundTo(proposedAnswer, roundingPlace);
        const isReasonable = roundedExactAnswer === roundedProposedAnswer;
        return {
            kind: 'reasonableness',
            operands: [values.num1, values.num2, values.num3],
            operations,
            intermediate: values.intermediate,
            exactAnswer: values.answer,
            proposedAnswer,
            roundingPlace,
            roundedExactAnswer,
            roundedProposedAnswer,
            isReasonable
        };
    }
}
