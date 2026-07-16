import { ProblemGenerator, GeneratorInput, ProblemStub, AbstractProblem } from "../../types/ml-engine.ts";
import { ComparisonProblem } from "../../types/problems.ts";
import { random } from "../../lib/random.ts";
import { Scope } from "edugraph-ts";
import { resolveRangeFromLabels, isSubConceptOf } from "../../lib/ontology.ts";

export class ComparisonGenerator implements ProblemGenerator<ComparisonProblem> {
    type: AbstractProblem['type'] = 'comparison';

    generate(input: GeneratorInput): ProblemStub | null {
        const { labels, constraints } = input;

        let mode = constraints.mode;
        if (!mode && labels) {
            if (labels.some(l => isSubConceptOf(l, Scope.PhysicalNumbers))) {
                mode = 'count-compare';
            } else {
                mode = 'numeric';
            }
        }
        if (!mode) mode = 'numeric';

        if (mode !== 'numeric' && mode !== 'matching' && mode !== 'count-compare') {
            return null;
        }

        const resolvedRange = resolveRangeFromLabels(labels || []);
        let num1 = 0;
        let num2 = 0;

        if (mode === 'numeric') {
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

            num1 = Math.floor(random() * (max - min + 1)) + min;
            num2 = Math.floor(random() * (max - min + 1)) + min;

            if (num1 === num2) {
                return null;
            }
        } else {
            let maxCount = constraints.maxCount || constraints.count || resolvedRange.max;
            let minCount = constraints.minCount || (constraints.count !== undefined ? constraints.count : resolvedRange.min);
            
            num1 = constraints.count !== undefined ? constraints.count : Math.floor(random() * (maxCount - minCount + 1)) + minCount;
            num2 = constraints.count !== undefined ? constraints.count : Math.floor(random() * (maxCount - minCount + 1)) + minCount;
            
            const comparisonType = constraints.comparisonType || 'greater';
            if (comparisonType === 'equal') {
                num2 = num1;
            } else if (comparisonType === 'greater') {
                if (num1 <= num2) {
                    num1 = Math.floor(random() * (maxCount - (minCount + 1) + 1)) + minCount + 1;
                    num2 = Math.floor(random() * (num1 - minCount)) + minCount;
                }
            } else if (comparisonType === 'less') {
                if (num1 >= num2) {
                    num2 = Math.floor(random() * (maxCount - (minCount + 1) + 1)) + minCount + 1;
                    num1 = Math.floor(random() * (num2 - minCount)) + minCount;
                }
            }
        }

        let answer: '<' | '>' | '=';
        if (num1 > num2) answer = '>';
        else if (num1 < num2) answer = '<';
        else answer = '=';

        return {
            id: `${mode}-${num1}-${num2}`,
            data: {
                num1,
                num2,
                answer
            }
        };
    }
}
