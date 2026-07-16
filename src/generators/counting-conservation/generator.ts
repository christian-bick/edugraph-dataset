import { ProblemGenerator, GeneratorInput, ProblemStub, AbstractProblem } from "../../types/ml-engine.ts";
import { CountingConservationProblem } from "../../types/problems.ts";
import { random } from "../../lib/random.ts";
import { Area } from "edugraph-ts";
import { resolveRangeFromLabels, isSubConceptOf } from "../../lib/ontology.ts";

export class CountingConservationGenerator implements ProblemGenerator<CountingConservationProblem> {
    type: AbstractProblem['type'] = 'counting';

    generate(input: GeneratorInput): ProblemStub | null {
        const { labels, constraints } = input;

        // Guard
        if (constraints.mode && constraints.mode !== 'conservation') {
            return null;
        }
        if (!constraints.mode && labels && !labels.some(l => isSubConceptOf(l, Area.NumericIdentity))) {
            return null;
        }

        const resolvedRange = resolveRangeFromLabels(labels || []);
        const minCount = constraints.minCount !== undefined ? constraints.minCount : resolvedRange.min;
        const maxCount = constraints.maxCount !== undefined ? constraints.maxCount : resolvedRange.max;
        const count = Math.floor(random() * (maxCount - minCount + 1)) + minCount;

        return {
            id: `conservation-${count}`,
            data: {
                numObjects: count
            }
        };
    }
}
