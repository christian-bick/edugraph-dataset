import {AbstractProblem, GeneratorInput, ProblemGenerator, ProblemStub} from "../../types/ml-engine.ts";
import {CountingIncDecProblem} from "../../types/problems.ts";
import {random} from "../../lib/random.ts";
import {resolveRangeFromLabels, isSubConceptOf} from "../../lib/ontology.ts";
import {Scope} from "edugraph-ts";

export class CountingIncDecGenerator implements ProblemGenerator<CountingIncDecProblem> {
    type: AbstractProblem['type'] = 'counting';

    generate(input: GeneratorInput): ProblemStub | null {
        const { labels } = input;

        let incDecType: 'inc' | 'dec' = 'inc';
        if (labels && labels.some(l => isSubConceptOf(l, Scope.SubtractiveCount))) {
            incDecType = 'dec';
        } else if (labels && labels.some(l => isSubConceptOf(l, Scope.AdditiveCount))) {
            incDecType = 'inc';
        } else {
            incDecType = random() > 0.5 ? 'inc' : 'dec';
        }

        const resolvedRange = resolveRangeFromLabels(labels || []);
        let maxCount = resolvedRange.max;
        let minCount = resolvedRange.min;
        
        const numObjects = Math.floor(random() * (maxCount - minCount + 1)) + minCount;
        
        if (incDecType === 'dec' && numObjects <= 1) {
            return null;
        }

        let incDecAnswer = 0;
        if (incDecType === 'inc') incDecAnswer = numObjects + 1;
        if (incDecType === 'dec') incDecAnswer = numObjects - 1;

        return {
            id: `simple-${numObjects}-${incDecType}`,
            data: {
                numObjects: numObjects,
                incDecType: incDecType as 'inc' | 'dec',
                incDecAnswer: incDecAnswer,
                simpleAnswer: numObjects
            }
        };
    }
}
