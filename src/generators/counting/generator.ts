import {AbstractProblem, GeneratorInput, ProblemGenerator, ProblemStub} from "../../types/ml-engine.ts";
import {CountingProblem} from "../../types/problems.ts";
import {random} from "../../lib/random.ts";
import {resolveRangeFromLabels} from "../../lib/ontology.ts";

export class CountingGenerator implements ProblemGenerator<CountingProblem> {
    type: AbstractProblem['type'] = 'counting';

    generate(input: GeneratorInput): ProblemStub | null {
        const { labels, constraints } = input;

        const resolvedRange = resolveRangeFromLabels(labels || []);
        const maxCount = resolvedRange.max;
        const minCount = resolvedRange.min;
        
        const numObjects = Math.floor(random() * (maxCount - minCount + 1)) + minCount;

        const data: CountingProblem = {
            numObjects,
            simpleAnswer: numObjects
        };

        if (constraints.countOut) {
            // Provide a pool of total objects larger than the target count
            // Ensure total doesn't exceed 20 to fit on screen usually, unless numObjects is already very large
            const extra = Math.floor(random() * 5) + 2; // +2 to +6 extra objects
            data.totalCount = numObjects + extra;
        }

        return {
            id: `count-${numObjects}`,
            data
        };
    }
}
