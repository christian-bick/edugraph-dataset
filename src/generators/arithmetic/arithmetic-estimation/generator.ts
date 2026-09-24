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
const PREFERRED_MINIMUM_OPERAND = 11;

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

        const minimum = Math.max(0, Math.ceil(config.range!.min));
        const maximum = Math.min(MAX_ESTIMATION_VALUE, Math.floor(config.range!.max));
        if (!Number.isFinite(minimum) || !Number.isFinite(maximum) || minimum >= maximum) return null;
        // Nonzero rounded operands and their rounded relation cannot all occupy a
        // domain containing just one multiple of ten.
        if (Math.ceil(minimum / ROUNDING_PLACE) >= Math.floor(maximum / ROUNDING_PLACE)) return null;

        const randomInteger = (min: number, max: number): number | null => {
            if (min > max) return null;
            return min + Math.floor(random() * (max - min + 1));
        };

        for (let attempt = 0; attempt < 300; attempt++) {
            const candidate = this.createCandidate(operation, minimum, maximum, randomInteger);
            if (!candidate) continue;

            return {
                data: {
                    ...candidate,
                    numberDomain: {min: minimum, max: maximum},
                    operation: operationNames[operation] as ArithmeticOperation,
                    roundingPlace: ROUNDING_PLACE
                }
            };
        }

        return null;
    }

    private createCandidate(
        operation: OperationLabel,
        minimum: number,
        maximum: number,
        randomInteger: (min: number, max: number) => number | null
    ): Candidate | null {
        let num1: number | null;
        let num2: number | null;
        const minimumOperand = Math.max(1, minimum,
            maximum < 2 * PREFERRED_MINIMUM_OPERAND ? 1 : PREFERRED_MINIMUM_OPERAND);

        if (operation === Area.Addition) {
            num1 = randomInteger(minimumOperand, Math.min(700, maximum - minimumOperand));
            num2 = num1 === null ? null : randomInteger(minimumOperand, maximum - num1);
        } else if (operation === Area.Subtraction) {
            num2 = randomInteger(minimumOperand, Math.min(400, maximum - minimumOperand));
            const difference = num2 === null ? null : randomInteger(minimumOperand, maximum - num2);
            num1 = num2 === null || difference === null ? null : num2 + difference;
        } else if (operation === Area.Multiplication) {
            num1 = randomInteger(minimumOperand, Math.min(49, maximum));
            num2 = num1 === null ? null : randomInteger(minimumOperand, Math.min(49, Math.floor(maximum / num1)));
        } else {
            num2 = randomInteger(minimumOperand, Math.min(49, maximum));
            const quotient = num2 === null ? null : randomInteger(Math.max(2, minimum), Math.min(80, Math.floor(maximum / num2)));
            num1 = num2 === null || quotient === null ? null : num2 * quotient;
        }

        if (num1 === null || num2 === null) return null;

        const roundedNum1 = roundToTen(num1);
        const roundedNum2 = roundToTen(num2);
        if (roundedNum1 === num1 && roundedNum2 === num2) return null;
        if (roundedNum2 === 0) return null;

        const exactAnswer = applyOperation(num1, num2, operation);
        const estimatedAnswer = applyOperation(roundedNum1, roundedNum2, operation);
        const values = [num1, num2, roundedNum1, roundedNum2, exactAnswer, estimatedAnswer,
            roundToTen(estimatedAnswer)];
        if (!values.every(value => Number.isInteger(value) && value >= minimum && value <= maximum)) return null;

        return {num1, num2, roundedNum1, roundedNum2, exactAnswer, estimatedAnswer};
    }
}
