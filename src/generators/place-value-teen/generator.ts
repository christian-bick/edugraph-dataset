import {AbstractProblem, GeneratorInput, ProblemGenerator, ProblemStub} from "../../types/ml-engine.ts";
import {PlaceValueTeenProblem} from "../../types/problems.ts";
import {random} from "../../lib/random.ts";
import {resolveRangeFromLabels} from "../../lib/ontology.ts";

export class PlaceValueTeenGenerator implements ProblemGenerator<PlaceValueTeenProblem> {
    type: AbstractProblem['type'] = 'arithmetic';

    generate(input: GeneratorInput): ProblemStub | null {
        const { labels } = input;

        const resolvedRange = resolveRangeFromLabels(labels || []);
        const resolvedMin = resolvedRange.min >= 10 ? resolvedRange.min : 11;
        const resolvedMax = resolvedRange.max <= 20 ? resolvedRange.max : 19;
        const ones = Math.floor(random() * (resolvedMax - resolvedMin + 1)) + resolvedMin - 10;
        const target = 10 + ones;

        return {
            id: `place-value-teen-${target}`,
            data: {
                ones,
                target
            }
        };
    }
}
