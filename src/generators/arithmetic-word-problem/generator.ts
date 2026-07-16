import { ProblemGenerator, GeneratorInput, ProblemStub, AbstractProblem } from "../../types/ml-engine.ts";
import { ArithmeticRepresentationProblem } from "../../types/problems.ts";
import { random } from "../../lib/random.ts";
import { resolveRangeFromLabels } from "../../lib/ontology.ts";

export class ArithmeticWordProblemGenerator implements ProblemGenerator<ArithmeticRepresentationProblem> {
    type: AbstractProblem['type'] = 'arithmetic';

    generate(input: GeneratorInput): ProblemStub | null {
        const { labels, constraints } = input;

        // Guard
        if (constraints.mode && constraints.mode !== 'word-problem') {
            return null;
        }

        const resolvedRange = resolveRangeFromLabels(labels || []);
        const operation = constraints.operation || (random() > 0.5 ? 'addition' : 'subtraction');
        let num1 = 0;
        let num2 = 0;
        let answer = 0;

        if (operation === 'addition') {
            const maxSum = constraints.maxSum || resolvedRange.max;
            num1 = Math.floor(random() * (maxSum - 1)) + 1; // 1 to maxSum-1
            num2 = Math.floor(random() * (maxSum - num1)) + 1; // 1 to maxSum-num1
            answer = num1 + num2;
        } else {
            const maxMinuend = constraints.maxMinuend || resolvedRange.max;
            num1 = Math.floor(random() * (maxMinuend - 2)) + 2; // 2 to maxMinuend
            num2 = Math.floor(random() * (num1 - 1)) + 1; // 1 to num1-1
            answer = num1 - num2;
        }

        const addTemplates = [
            `Maya has ${num1} stickers. She gets ${num2} more. How many stickers does she have now?`,
            `There are ${num1} red birds and ${num2} blue birds on a tree. How many birds are there in total?`
        ];
        const subTemplates = [
            `There were ${num1} apples on a table. Liam ate ${num2} of them. How many apples are left?`,
            `There are ${num1} balloons. ${num2} balloons pop. How many balloons are left?`
        ];
        const templates = operation === 'addition' ? addTemplates : subTemplates;
        const textScenario = templates[Math.floor(random() * templates.length)];

        return {
            id: `word-problem-${operation}-${num1}-${num2}`,
            data: {
                mode: 'word-problem',
                operation,
                num1,
                num2,
                answer,
                textScenario
            }
        };
    }
}
