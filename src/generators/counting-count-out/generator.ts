import { ProblemGenerator, GeneratorInput, ProblemStub, AbstractProblem } from "../../types/ml-engine.ts";
import { CountingCountOutProblem } from "../../types/problems.ts";
import { random } from "../../lib/random.ts";
import { resolveRangeFromLabels } from "../../lib/ontology.ts";

export class CountingCountOutGenerator implements ProblemGenerator<CountingCountOutProblem> {
    type: AbstractProblem['type'] = 'counting';

    generate(input: GeneratorInput): ProblemStub | null {
        const { labels, constraints } = input;

        // Guard
        if (constraints.mode && constraints.mode !== 'count-out') {
            return null;
        }
        if (!constraints.mode && !constraints.countOut) {
            return null;
        }

        const resolvedRange = resolveRangeFromLabels(labels || []);
        let maxCount = constraints.maxCount || constraints.count || resolvedRange.max;
        let minCount = constraints.minCount || (constraints.count !== undefined ? constraints.count : resolvedRange.min);
        
        const numObjects = constraints.count !== undefined ? constraints.count : Math.floor(random() * (maxCount - minCount + 1)) + minCount;
        const totalCount = constraints.totalCount || Math.max(numObjects, Math.floor(random() * (20 - numObjects + 1)) + numObjects);
        const arrangement = constraints.arrangement || 'line';

        return {
            id: `count-out-${numObjects}-${totalCount}`,
            data: {
                mode: 'count-out',
                numObjects,
                totalCount,
                simpleAnswer: numObjects,
                arrangement
            }
        };
    }
}
