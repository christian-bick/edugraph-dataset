import {AbstractProblem, ProblemGenerator, ProblemStub} from "../../../types/ml-engine.ts";
import {PlaceValueTeenProblem} from "../../../types/problems.ts";
import {random} from "../../../lib/random.ts";
import {PlaceValueTeenGeneratorConfig, PlaceValueTeenGeneratorSchema} from "./spec.ts";
import {GeneratorValidationError, validateConfigFields} from "../../../lib/errors.ts";

export class PlaceValueTeenGenerator implements ProblemGenerator<PlaceValueTeenProblem, PlaceValueTeenGeneratorConfig> {
    type: AbstractProblem['type'] = 'arithmetic';
    schema = PlaceValueTeenGeneratorSchema;

    generate(config: PlaceValueTeenGeneratorConfig): ProblemStub | null {
        validateConfigFields('place-value-teen', config, ['range']);
        const resolvedRange = config.range!;

        if (resolvedRange.min > resolvedRange.max) {
            throw new GeneratorValidationError('place-value-teen', `Invalid range bounds: min (${resolvedRange.min}) exceeds max (${resolvedRange.max}).`);
        }

        // The ontology's upper-bound scope includes 20, while this dedicated
        // generator represents only teen numbers. Enforce 11-19 internally.
        const resolvedMin = Math.max(11, resolvedRange.min);
        const resolvedMax = Math.min(19, resolvedRange.max);

        if (resolvedMin > resolvedMax) {
            throw new GeneratorValidationError('place-value-teen', `Effective range bounds invalid: resolvedMin (${resolvedMin}) exceeds resolvedMax (${resolvedMax}).`);
        }
        const ones = Math.floor(random() * (resolvedMax - resolvedMin + 1)) + resolvedMin - 10;
        const target = 10 + ones;

        return {
            data: {
                ones,
                target
            }
        };
    }
}
