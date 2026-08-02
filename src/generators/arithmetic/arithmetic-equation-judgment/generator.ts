import {Area} from 'edugraph-ts';
import {validateConfigFields} from '../../../lib/errors.ts';
import {random} from '../../../lib/random.ts';
import {AbstractProblem, ProblemGenerator, ProblemStub} from '../../../types/ml-engine.ts';
import {EquationJudgmentProblem} from '../../../types/problems.ts';
import {ArithmeticEquationJudgmentGeneratorConfig, ArithmeticEquationJudgmentGeneratorSchema} from './spec.ts';

export class ArithmeticEquationJudgmentGenerator implements ProblemGenerator<EquationJudgmentProblem, ArithmeticEquationJudgmentGeneratorConfig> {
    type: AbstractProblem['type'] = 'arithmetic';
    schema = ArithmeticEquationJudgmentGeneratorSchema;

    generate(config: ArithmeticEquationJudgmentGeneratorConfig): ProblemStub | null {
        validateConfigFields('arithmetic-equation-judgment', config, ['operation', 'requireZero', 'range']);
        const operation = config.operation;
        const requireZero = config.requireZero!;
        const range = config.range!;
        const min = Math.max(1, Math.ceil(range.min));
        const max = Math.floor(range.max);
        if (min > max) return null;

        const randomInteger = (lower: number, upper: number): number | null => {
            if (lower > upper) return null;
            return lower + Math.floor(random() * (upper - lower + 1));
        };

        let num1: number;
        let num2: number;
        let answer: number;
        if (operation === Area.Addition) {
            if (requireZero) {
                num1 = 0;
                num2 = randomInteger(min, max) ?? 0;
                answer = num2;
            } else {
                num1 = randomInteger(min, max - min) ?? 0;
                if (num1 === 0) return null;
                num2 = randomInteger(min, max - num1) ?? 0;
                if (num2 === 0) return null;
                answer = num1 + num2;
            }
        } else if (operation === Area.Subtraction) {
            if (requireZero) {
                num1 = randomInteger(min, max) ?? 0;
                if (num1 === 0) return null;
                num2 = num1;
                answer = 0;
            } else {
                num2 = randomInteger(min, max - min) ?? 0;
                answer = randomInteger(min, max - num2) ?? 0;
                if (num2 === 0 || answer === 0) return null;
                num1 = num2 + answer;
            }
        } else {
            return null;
        }

        const isTrue = random() < 0.5;
        let claimedAnswer = answer;
        if (!isTrue) {
            const falseCandidates = [answer - 1, answer + 1]
                .filter(value => value >= (requireZero ? 0 : 1) && value <= max && value !== answer);
            if (falseCandidates.length === 0) return null;
            claimedAnswer = falseCandidates[Math.floor(random() * falseCandidates.length)];
        }

        return {
            data: {
                num1,
                num2,
                operation: operation === Area.Addition ? 'addition' : 'subtraction',
                claimedAnswer,
                isTrue
            }
        };
    }
}
