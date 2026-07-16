import {AbstractProblem, GeneratorInput, ProblemGenerator, ProblemStub} from "../../types/ml-engine.ts";
import {CountingProblem} from "../../types/problems.ts";
import {random} from "../../lib/random.ts";
import {resolveRangeFromLabels} from "../../lib/ontology.ts";

export class CountingGenerator implements ProblemGenerator<CountingProblem> {
    type: AbstractProblem['type'] = 'counting';

    generate(input: GeneratorInput): ProblemStub | null {
        const { labels } = input;

        const resolvedRange = resolveRangeFromLabels(labels || []);
        const maxCount = resolvedRange.max;
        const minCount = resolvedRange.min;
        
        const numObjects = Math.floor(random() * (maxCount - minCount + 1)) + minCount;

        const data: CountingProblem = {
            numObjects,
            simpleAnswer: numObjects
        };

        return {
            id: `count-${numObjects}`,
            data
        };
    }
}
