import {AbstractProblem, GeneratorInput, ProblemGenerator, ProblemStub} from "../../types/ml-engine.ts";
import {ComparisonProblem} from "../../types/problems.ts";
import {random} from "../../lib/random.ts";
import {resolveRangeFromLabels} from "../../lib/ontology.ts";

export class ComparisonGenerator implements ProblemGenerator<ComparisonProblem> {
    type: AbstractProblem['type'] = 'comparison';

    generate(input: GeneratorInput): ProblemStub | null {
        const { labels, constraints = {} } = input;

        const resolvedRange = resolveRangeFromLabels(labels || []);
        const min = resolvedRange.min;
        const max = resolvedRange.max;

        let num1 = Math.floor(random() * (max - min + 1)) + min;
        let num2 = Math.floor(random() * (max - min + 1)) + min;

        const comparisonType = constraints.comparisonType;
        if (comparisonType === 'equal') {
            num2 = num1;
        } else if (comparisonType === 'greater') {
            if (num1 <= num2) {
                if (max > min) {
                    num1 = Math.floor(random() * (max - (min + 1) + 1)) + min + 1;
                    num2 = Math.floor(random() * (num1 - min)) + min;
                } else {
                    return null;
                }
            }
        } else if (comparisonType === 'less') {
            if (num1 >= num2) {
                if (max > min) {
                    num2 = Math.floor(random() * (max - (min + 1) + 1)) + min + 1;
                    num1 = Math.floor(random() * (num2 - min)) + min;
                } else {
                    return null;
                }
            }
        } else {
            // Give a slight bump to the chance of generating equal numbers for variety
            // especially for wider ranges where the natural probability is low.
            if (random() < 0.1) {
                num2 = num1;
            }
        }

        let answer: '<' | '>' | '=';
        if (num1 > num2) answer = '>';
        else if (num1 < num2) answer = '<';
        else answer = '=';

        return {
            id: `compare-${num1}-${num2}`,
            data: {
                num1,
                num2,
                answer
            }
        };
    }
}
