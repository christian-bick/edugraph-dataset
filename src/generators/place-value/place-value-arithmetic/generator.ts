import {Area} from 'edugraph-ts';
import {validateConfigFields} from '../../../lib/errors.ts';
import {random} from '../../../lib/random.ts';
import {AbstractProblem, ProblemGenerator, ProblemStub} from '../../../types/ml-engine.ts';
import {PlaceValueArithmeticProblem, PlaceValueDigits} from '../../../types/problems.ts';
import {PlaceValueArithmeticGeneratorConfig, PlaceValueArithmeticGeneratorSchema} from './spec.ts';

const randomInteger = (min: number, max: number) => min + Math.floor(random() * (max - min + 1));

const digits = (number: number): PlaceValueDigits => ({
    hundreds: Math.floor(number / 100),
    tens: Math.floor((number % 100) / 10),
    ones: number % 10
});

export class PlaceValueArithmeticGenerator implements ProblemGenerator<PlaceValueArithmeticProblem, PlaceValueArithmeticGeneratorConfig> {
    type: AbstractProblem['type'] = 'arithmetic';
    schema = PlaceValueArithmeticGeneratorSchema;

    generate(config: PlaceValueArithmeticGeneratorConfig): ProblemStub<PlaceValueArithmeticProblem> | null {
        validateConfigFields('place-value-arithmetic', config, ['operation', 'range']);
        const range = config.range!;
        const max = Math.min(999, Math.floor(range.max));
        if (max < 20) return null;

        let num1: number;
        let num2: number;
        let answer: number;
        let regrouping: string;
        let strategySteps: string[];

        if (config.operation === Area.Addition) {
            for (let attempt = 0; attempt < 100; attempt++) {
                num1 = randomInteger(11, max - 10);
                num2 = randomInteger(10, max - num1);
                if (num1 % 10 + num2 % 10 < 10) continue;
                answer = num1 + num2;
                const left = digits(num1);
                const right = digits(num2);
                const onesTotal = left.ones + right.ones;
                regrouping = `${left.ones} ones + ${right.ones} ones = ${onesTotal} ones; regroup 10 ones as 1 ten.`;
                strategySteps = [
                    `Add the ones: ${left.ones} + ${right.ones} = ${onesTotal}.`,
                    `Regroup ${onesTotal} ones as 1 ten and ${onesTotal - 10} ones.`,
                    `Then combine the tens and hundreds to get ${answer}.`
                ];
                return this.problem(num1, num2, answer, 'addition', regrouping, strategySteps);
            }
            return null;
        }

        if (config.operation === Area.Subtraction) {
            for (let attempt = 0; attempt < 100; attempt++) {
                num1 = randomInteger(21, max);
                num2 = randomInteger(10, num1 - 1);
                if (num1 % 10 >= num2 % 10 || Math.floor((num1 % 100) / 10) === 0) continue;
                answer = num1 - num2;
                const left = digits(num1);
                const right = digits(num2);
                regrouping = `Regroup 1 ten from ${num1} as 10 ones, giving ${left.ones + 10} ones before subtracting ${right.ones}.`;
                strategySteps = [
                    `The ${left.ones} ones cannot subtract ${right.ones} ones directly.`,
                    `Regroup 1 ten as 10 ones: ${left.ones + 10} − ${right.ones} = ${left.ones + 10 - right.ones}.`,
                    `Then subtract the remaining tens and hundreds to get ${answer}.`
                ];
                return this.problem(num1, num2, answer, 'subtraction', regrouping, strategySteps);
            }
            return null;
        }

        return null;
    }

    private problem(
        num1: number,
        num2: number,
        answer: number,
        operation: 'addition' | 'subtraction',
        regrouping: string,
        strategySteps: string[]
    ): ProblemStub<PlaceValueArithmeticProblem> {
        return {
            data: {
                num1,
                num2,
                answer,
                operation,
                operands: [digits(num1), digits(num2)],
                result: digits(answer),
                regrouping,
                equation: `${num1} ${operation === 'addition' ? '+' : '−'} ${num2} = ${answer}`,
                strategySteps
            }
        };
    }
}
