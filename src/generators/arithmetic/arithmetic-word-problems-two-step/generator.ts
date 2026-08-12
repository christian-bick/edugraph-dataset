import {Area} from 'edugraph-ts';
import {validateConfigFields} from '../../../lib/errors.ts';
import {random} from '../../../lib/random.ts';
import {AbstractProblem, ProblemGenerator, ProblemStub} from '../../../types/ml-engine.ts';
import {ArithmeticWordProblemTwoStep} from '../../../types/problems.ts';
import {
    ArithmeticWordProblemsTwoStepGeneratorConfig,
    ArithmeticWordProblemsTwoStepGeneratorSchema
} from './spec.ts';

type Values = Pick<
    ArithmeticWordProblemTwoStep,
    'num1' | 'num2' | 'num3' | 'intermediate' | 'answer'
>;

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
        const maximum = Math.floor(config.range!.max);
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
                operations: [
                    operations[0] === Area.Addition ? 'addition' : 'subtraction',
                    operations[1] === Area.Addition ? 'addition' : 'subtraction'
                ],
                blankPart: 'solution'
            }
        };
    }

    private generateValues(
        operations: readonly [string, string],
        minimum: number,
        maximum: number,
        randomInteger: (min: number, max: number) => number | null
    ): Values | null {
        if (operations[0] === Area.Addition && operations[1] === Area.Addition) {
            const num1 = randomInteger(minimum, maximum - 2 * minimum);
            if (num1 === null) return null;
            const num2 = randomInteger(minimum, maximum - num1 - minimum)!;
            const num3 = randomInteger(minimum, maximum - num1 - num2)!;
            const intermediate = num1 + num2;
            return {num1, num2, num3, intermediate, answer: intermediate + num3};
        }

        if (operations[0] === Area.Subtraction && operations[1] === Area.Subtraction) {
            const num2 = randomInteger(minimum, maximum - 2 * minimum);
            if (num2 === null) return null;
            const num3 = randomInteger(minimum, maximum - num2 - minimum)!;
            const answer = randomInteger(minimum, maximum - num2 - num3)!;
            const intermediate = answer + num3;
            return {num1: intermediate + num2, num2, num3, intermediate, answer};
        }

        if (operations[0] === Area.Addition && operations[1] === Area.Subtraction) {
            const num1 = randomInteger(minimum, maximum - 2 * minimum);
            if (num1 === null) return null;
            const num2 = randomInteger(minimum, maximum - num1 - minimum)!;
            const intermediate = num1 + num2;
            const num3 = randomInteger(minimum, intermediate - minimum)!;
            return {num1, num2, num3, intermediate, answer: intermediate - num3};
        }

        return null;
    }
}
