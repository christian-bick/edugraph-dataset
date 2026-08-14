import {Area} from 'edugraph-ts';
import {validateConfigFields} from '../../../lib/errors.ts';
import {random} from '../../../lib/random.ts';
import {AbstractProblem, ProblemGenerator, ProblemStub} from '../../../types/ml-engine.ts';
import {ArithmeticWordProblemTwoStep} from '../../../types/problems.ts';
import {
    ArithmeticWordProblemsTwoStepGeneratorConfig,
    ArithmeticWordProblemsTwoStepGeneratorSchema
} from './spec.ts';
import {operationNames, TwoStepOperationLabels} from '../helpers.ts';

type Values = Pick<
    ArithmeticWordProblemTwoStep,
    'num1' | 'num2' | 'num3' | 'intermediate' | 'answer'
>;

const MAX_TWO_STEP_VALUE = 100;

export class ArithmeticWordProblemsTwoStepGenerator implements ProblemGenerator<
    ArithmeticWordProblemTwoStep,
    ArithmeticWordProblemsTwoStepGeneratorConfig
> {
    type: AbstractProblem['type'] = 'arithmetic';
    schema = ArithmeticWordProblemsTwoStepGeneratorSchema;

    generate(
        config: ArithmeticWordProblemsTwoStepGeneratorConfig
    ): ProblemStub<ArithmeticWordProblemTwoStep> | null {
        validateConfigFields('arithmetic-word-problems-two-step', config, ['operations', 'range']);

        const operations = config.operations!;
        if (operations === 'unsupported') return null;

        const minimum = Math.max(1, Math.ceil(config.range!.min));
        const maximum = Math.min(MAX_TWO_STEP_VALUE, Math.floor(config.range!.max));
        if (minimum > maximum) return null;

        const randomInteger = (min: number, max: number): number | null => {
            if (min > max) return null;
            return min + Math.floor(random() * (max - min + 1));
        };

        const values = this.generateValues(operations, minimum, maximum, randomInteger);
        if (!values) return null;

        return {
            tags: [],
            data: {
                kind: 'two-step',
                ...values,
                operations: [operationNames[operations[0]], operationNames[operations[1]]],
                blankPart: 'solution'
            }
        };
    }

    private generateValues(
        operations: TwoStepOperationLabels,
        minimum: number,
        maximum: number,
        randomInteger: (min: number, max: number) => number | null
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
            const values = [num1, num2, num3, intermediate, answer];
            if (values.every(value => Number.isInteger(value)
                && value >= minimum
                && value <= maximum)) {
                return {num1, num2, num3, intermediate, answer};
            }
        }

        return null;
    }
}
