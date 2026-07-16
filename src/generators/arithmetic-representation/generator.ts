import { ProblemGenerator, GeneratorInput, ProblemStub, AbstractProblem } from "../../types/ml-engine.ts";
import { ArithmeticRepresentationProblem } from "../../types/problems.ts";
import { random } from "../../lib/random.ts";
import { Scope, Ability } from "edugraph-ts";
import { resolveRangeFromLabels, isSubConceptOf } from "../../lib/ontology.ts";

export class ArithmeticRepresentationGenerator implements ProblemGenerator<ArithmeticRepresentationProblem> {
    type: AbstractProblem['type'] = 'arithmetic';

    generate(input: GeneratorInput): ProblemStub | null {
        const { labels, constraints } = input;

        // Guard
        if (constraints.mode && constraints.mode !== 'representation') {
            return null;
        }
        if (!constraints.mode && labels) {
            if (!labels.some(l => isSubConceptOf(l, Scope.PhysicalNumbers)) || !labels.some(l => isSubConceptOf(l, Ability.ProcedureExecution))) {
                return null;
            }
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

        return {
            id: `representation-${operation}-${num1}-${num2}`,
            data: {
                mode: 'representation',
                operation,
                num1,
                num2,
                answer,
                textScenario: ''
            }
        };
    }
}
