import { ProblemGenerator, GeneratorInput, ProblemStub, AbstractProblem } from "../../types/ml-engine.ts";
import { ComparisonNumericProblem } from "../../types/problems.ts";
import { random } from "../../lib/random.ts";
import { Scope } from "edugraph-ts";
import { resolveRangeFromLabels, isSubConceptOf } from "../../lib/ontology.ts";

export class ComparisonGenerator implements ProblemGenerator<ComparisonNumericProblem> {
    type: AbstractProblem['type'] = 'comparison';

    generate(input: GeneratorInput): ProblemStub | null {
        const { labels, constraints } = input;

        // Guard
        if (constraints.mode && constraints.mode !== 'numeric') {
            return null;
        }
        if (!constraints.mode && labels && labels.some(l => isSubConceptOf(l, Scope.PhysicalNumbers))) {
            return null;
        }

        const resolvedRange = resolveRangeFromLabels(labels || []);

        let min = resolvedRange.min;
        let max = resolvedRange.max;

        let digits = constraints.digits;
        if (digits) {
            max = Math.pow(10, digits) - 1;
            min = digits > 1 ? Math.pow(10, digits - 1) : 0;
            const includesZero = constraints.includesZero !== undefined 
                ? constraints.includesZero 
                : !labels.some(l => isSubConceptOf(l, Scope.NumbersWithoutZero));
            if (!includesZero && digits === 1) {
                min = 1;
            }
        }

        const num1 = Math.floor(random() * (max - min + 1)) + min;
        const num2 = Math.floor(random() * (max - min + 1)) + min;

        if (num1 === num2) {
            return null;
        }

        const answer = num1 > num2 ? '>' : '<';
        const problemKey = `${num1}_${num2}`;
        
        return {
            id: problemKey,
            data: {
                mode: 'numeric',
                num1: num1,
                num2: num2,
                answer: answer
            }
        };
    }
}
