import {AbstractProblem, ProblemGenerator, ProblemStub} from "../../../types/ml-engine.ts";
import {PlaceValueMakeTenProblem} from "../../../types/problems.ts";
import {random} from "../../../lib/random.ts";
import {PlaceValueMakeTenGeneratorConfig, PlaceValueMakeTenGeneratorSchema} from "./spec.ts";
import {validateConfigFields, GeneratorValidationError} from "../../../lib/errors.ts";

export class PlaceValueMakeTenGenerator implements ProblemGenerator<PlaceValueMakeTenProblem, PlaceValueMakeTenGeneratorConfig> {
    type: AbstractProblem['type'] = 'arithmetic';
    schema = PlaceValueMakeTenGeneratorSchema;

    generate(config: PlaceValueMakeTenGeneratorConfig): ProblemStub | null {
        validateConfigFields('place-value-make-ten', config, ['includeZero', 'range']);
        const includeZero = config.includeZero;
        const resolvedRange = config.range!;

        const target = 10;
        // The given number is bounded by the make-ten domain intersected with
        // the requested range (missing = target - given stays within 0..10)
        const minGiven = Math.max(includeZero ? 0 : 1, resolvedRange.min);
        const maxGiven = Math.min(includeZero ? target : target - 1, resolvedRange.max);
        if (minGiven > maxGiven) {
            throw new GeneratorValidationError('place-value-make-ten', `Effective range bounds invalid: resolvedMin (${minGiven}) exceeds resolvedMax (${maxGiven}).`);
        }

        const givenNumber = Math.floor(random() * (maxGiven - minGiven + 1)) + minGiven;
        const missingNumber = target - givenNumber;

        return {
            id: `make-ten-${givenNumber}`,
            data: {
                givenNumber,
                missingNumber,
                target: 10
            }
        };
    }
}
