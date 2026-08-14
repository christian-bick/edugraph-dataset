import {Area} from 'edugraph-ts';
import {validateConfigFields} from '../../../lib/errors.ts';
import {random} from '../../../lib/random.ts';
import {AbstractProblem, ProblemGenerator, ProblemStub} from '../../../types/ml-engine.ts';
import {ArithmeticEstimationProblem, ArithmeticOperation} from '../../../types/problems.ts';
import {operationNames} from '../helpers.ts';
import {
    ArithmeticEstimationGeneratorConfig,
    ArithmeticEstimationGeneratorSchema
} from './spec.ts';

const MAX_ESTIMATION_VALUE = 1000;
const ROUNDING_PLACE = 10;

type OperationLabel = typeof Area.Addition
    | typeof Area.Subtraction
    | typeof Area.Multiplication
    | typeof Area.Division;

type Candidate = Pick<
    ArithmeticEstimationProblem,
    'num1' | 'num2' | 'roundedNum1' | 'roundedNum2' | 'exactAnswer' | 'estimatedAnswer'
>;

function applyOperation(left: number, right: number, operation: OperationLabel): number {
    if (operation === Area.Addition) return left + right;
    if (operation === Area.Subtraction) return left - right;
    if (operation === Area.Multiplication) return left * right;
    return left / right;
}

function roundToTen(value: number): number {
    return Math.round(value / ROUNDING_PLACE) * ROUNDING_PLACE;
}

export class ArithmeticEstimationGenerator implements ProblemGenerator<
    ArithmeticEstimationProblem,
    ArithmeticEstimationGeneratorConfig
> {
    type: AbstractProblem['type'] = 'arithmetic';
    schema = ArithmeticEstimationGeneratorSchema;

    generate(config: ArithmeticEstimationGeneratorConfig): ProblemStub<ArithmeticEstimationProblem> | null {
        validateConfigFields('arithmetic-estimation', config, ['operation', 'range']);

        const operation = config.operation;
        if (!operation || operation === 'unsupported') return null;

        const minimum = Math.max(1, Math.ceil(config.range!.min));
        const maximum = Math.min(MAX_ESTIMATION_VALUE, Math.floor(config.range!.max));
        if (minimum >= maximum) return null;

        const randomInteger = (min: number, max: number): number | null => {
            if (min > max) return null;
            return min + Math.floor(random() * (max - min + 1));
        };

        for (let attempt = 0; attempt < 300; attempt++) {
            const candidate = this.createCandidate(operation, maximum, randomInteger);
            if (!candidate) continue;

            const tolerance = Math.max(10, Math.ceil(Math.abs(candidate.estimatedAnswer) * 0.1));
            if (Math.abs(candidate.exactAnswer - candidate.estimatedAnswer) > tolerance) continue;

            const isReasonable = random() < 0.5;
            const proposedAnswer = isReasonable
                ? candidate.exactAnswer
                : this.createUnreasonableAnswer(candidate, tolerance, minimum, maximum, randomInteger);
            if (proposedAnswer === null) continue;

            return {
                data: {
                    ...candidate,
                    operation: operationNames[operation] as ArithmeticOperation,
                    roundingPlace: ROUNDING_PLACE,
                    proposedAnswer,
                    estimateDifference: Math.abs(proposedAnswer - candidate.estimatedAnswer),
                    tolerance,
                    isReasonable
                }
            };
        }

        return null;
    }

    private createCandidate(
        operation: OperationLabel,
        maximum: number,
        randomInteger: (min: number, max: number) => number | null
    ): Candidate | null {
        let num1: number | null;
        let num2: number | null;

        if (operation === Area.Addition) {
            num1 = randomInteger(11, Math.min(700, maximum - 11));
            num2 = num1 === null ? null : randomInteger(11, maximum - num1);
        } else if (operation === Area.Subtraction) {
            num2 = randomInteger(11, Math.min(400, maximum - 11));
            const difference = num2 === null ? null : randomInteger(11, maximum - num2);
            num1 = num2 === null || difference === null ? null : num2 + difference;
        } else if (operation === Area.Multiplication) {
            num1 = randomInteger(11, Math.min(49, maximum));
            num2 = num1 === null ? null : randomInteger(11, Math.min(49, Math.floor(maximum / num1)));
        } else {
            num2 = randomInteger(11, Math.min(49, maximum));
            const quotient = num2 === null ? null : randomInteger(2, Math.min(80, Math.floor(maximum / num2)));
            num1 = num2 === null || quotient === null ? null : num2 * quotient;
        }

        if (num1 === null || num2 === null) return null;

        const roundedNum1 = roundToTen(num1);
        const roundedNum2 = roundToTen(num2);
        if (roundedNum1 === num1 && roundedNum2 === num2) return null;
        if (roundedNum2 === 0) return null;

        const exactAnswer = applyOperation(num1, num2, operation);
        const estimatedAnswer = applyOperation(roundedNum1, roundedNum2, operation);
        const values = [num1, num2, roundedNum1, roundedNum2, exactAnswer, estimatedAnswer];
        if (!values.every(value => Number.isInteger(value) && value >= 0 && value <= maximum)) return null;

        return {num1, num2, roundedNum1, roundedNum2, exactAnswer, estimatedAnswer};
    }

    private createUnreasonableAnswer(
        candidate: Candidate,
        tolerance: number,
        minimum: number,
        maximum: number,
        randomInteger: (min: number, max: number) => number | null
    ): number | null {
        const distance = tolerance + (randomInteger(10, Math.max(10, tolerance)) ?? 10);
        const candidates = [
            candidate.estimatedAnswer + distance,
            candidate.estimatedAnswer - distance
        ].filter(value =>
            Number.isInteger(value)
            && value >= minimum
            && value <= maximum
            && value !== candidate.exactAnswer
            && Math.abs(value - candidate.estimatedAnswer) > tolerance
        );
        if (candidates.length === 0) return null;
        return candidates[Math.floor(random() * candidates.length)];
    }
}
