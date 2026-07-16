import { ProblemGenerator, GeneratorInput, ProblemStub, AbstractProblem } from "../../types/ml-engine.ts";
import { ComparisonMatchingProblem } from "../../types/problems.ts";
import { random } from "../../lib/random.ts";
import { Scope } from "edugraph-ts";
import { resolveRangeFromLabels, isSubConceptOf } from "../../lib/ontology.ts";

export class ComparisonMatchingGenerator implements ProblemGenerator<ComparisonMatchingProblem> {
    type: AbstractProblem['type'] = 'comparison';

    generate(input: GeneratorInput): ProblemStub | null {
        const { labels, constraints } = input;

        let mode = constraints.mode || 'matching';
        if (mode === 'compare-groups') {
            mode = 'matching';
        }

        // Guard
        if (mode !== 'matching' && mode !== 'count-compare') {
            return null;
        }
        if (!constraints.mode && labels && !labels.some(l => isSubConceptOf(l, Scope.PhysicalNumbers))) {
            return null;
        }

        const resolvedRange = resolveRangeFromLabels(labels || []);

        const comparisonType = constraints.comparisonType || (random() > 0.5 ? 'greater' : 'less');
        const minCount = constraints.minCount !== undefined ? constraints.minCount : resolvedRange.min;
        const maxCount = constraints.maxCount !== undefined ? constraints.maxCount : resolvedRange.max;
        let count1 = Math.floor(random() * (maxCount - minCount + 1)) + minCount;
        let count2 = Math.floor(random() * (maxCount - minCount + 1)) + minCount;

        if (comparisonType === 'greater') {
            while (count1 <= count2) {
                count1 = Math.floor(random() * (maxCount - minCount + 1)) + minCount;
                count2 = Math.floor(random() * (maxCount - minCount + 1)) + minCount;
            }
        } else if (comparisonType === 'less') {
            while (count1 >= count2) {
                count1 = Math.floor(random() * (maxCount - minCount + 1)) + minCount;
                count2 = Math.floor(random() * (maxCount - minCount + 1)) + minCount;
            }
        } else if (comparisonType === 'equal') {
            count1 = count2;
        }

        const answer = count1 > count2 ? 'A' : (count1 < count2 ? 'B' : 'equal');

        return {
            id: `${mode}-${count1}-${count2}-${comparisonType}`,
            data: {
                num1: count1,
                num2: count2,
                comparisonType,
                answer
            }
        };
    }
}
