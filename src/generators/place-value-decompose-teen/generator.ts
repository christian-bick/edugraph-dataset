import { ProblemGenerator, GeneratorInput, ProblemStub, AbstractProblem } from "../../types/ml-engine.ts";
import { PlaceValueDecomposeTeenProblem } from "../../types/problems.ts";
import { random } from "../../lib/random.ts";
import { resolveRangeFromLabels } from "../../lib/ontology.ts";

export class PlaceValueDecomposeTeenGenerator implements ProblemGenerator<PlaceValueDecomposeTeenProblem> {
    type: AbstractProblem['type'] = 'arithmetic';

    generate(input: GeneratorInput): ProblemStub | null {
        const { labels, constraints } = input;

        // Guard
        if (constraints.mode && constraints.mode !== 'decompose-teen') {
            return null;
        }

        const resolvedRange = resolveRangeFromLabels(labels || []);
        const resolvedMin = resolvedRange.min >= 10 ? resolvedRange.min : 11;
        const resolvedMax = resolvedRange.max <= 20 ? resolvedRange.max : 19;
        const ones = constraints.ones !== undefined 
            ? constraints.ones 
            : (constraints.target !== undefined ? constraints.target - 10 : Math.floor(random() * (resolvedMax - resolvedMin + 1)) + resolvedMin - 10);
        const target = 10 + ones;

        return {
            id: `decompose-teen-${target}`,
            data: {
                mode: 'decompose-teen',
                ones,
                target
            }
        };
    }
}
