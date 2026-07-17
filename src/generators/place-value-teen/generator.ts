import {AbstractProblem, ProblemGenerator, ProblemStub} from "../../types/ml-engine.ts";
import {PlaceValueTeenProblem} from "../../types/problems.ts";
import {random} from "../../lib/random.ts";
import {PlaceValueTeenGeneratorConfig, PlaceValueTeenGeneratorSchema} from "./spec.ts";

export class PlaceValueTeenGenerator implements ProblemGenerator<PlaceValueTeenProblem, PlaceValueTeenGeneratorConfig> {
    type: AbstractProblem['type'] = 'arithmetic';
    schema = PlaceValueTeenGeneratorSchema;

    generate(config: PlaceValueTeenGeneratorConfig): ProblemStub | null {
        const resolvedRange = config.range;

        if (!resolvedRange) return null;

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
