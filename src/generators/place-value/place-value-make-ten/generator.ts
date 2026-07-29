import {AbstractProblem, ProblemGenerator, ProblemStub} from "../../../types/ml-engine.ts";
import {PlaceValueMakeTenProblem} from "../../../types/problems.ts";
import {random} from "../../../lib/random.ts";
import {PlaceValueMakeTenGeneratorConfig, PlaceValueMakeTenGeneratorSchema} from "./spec.ts";
import {validateConfigFields, GeneratorValidationError} from "../../../lib/errors.ts";

export class PlaceValueMakeTenGenerator implements ProblemGenerator<PlaceValueMakeTenProblem, PlaceValueMakeTenGeneratorConfig> {
    type: AbstractProblem['type'] = 'arithmetic';
    schema = PlaceValueMakeTenGeneratorSchema;

    generate(config: PlaceValueMakeTenGeneratorConfig): ProblemStub | null {
        validateConfigFields('place-value-make-ten', config, ['requireZero', 'range']);
        const resolvedRange = config.range!;

        const target = 10;
        if (config.requireZero) {
            const zeroWitnesses = [0, target].filter(
                given => given >= resolvedRange.min && given <= resolvedRange.max
            );
            if (zeroWitnesses.length === 0) {
                throw new GeneratorValidationError(
                    'place-value-make-ten',
                    'The requested range excludes both make-ten zero witnesses (0 and 10).'
                );
            }
            const givenNumber = zeroWitnesses[Math.floor(random() * zeroWitnesses.length)];
            return {
                data: {
                    givenNumber,
                    missingNumber: target - givenNumber,
                    target
                }
            };
        }

        const minGiven = Math.max(1, resolvedRange.min);
        const maxGiven = Math.min(target - 1, resolvedRange.max);
        if (minGiven > maxGiven) {
            throw new GeneratorValidationError('place-value-make-ten', `Effective range bounds invalid: resolvedMin (${minGiven}) exceeds resolvedMax (${maxGiven}).`);
        }

        const givenNumber = Math.floor(random() * (maxGiven - minGiven + 1)) + minGiven;
        const missingNumber = target - givenNumber;

        return {
            data: {
                givenNumber,
                missingNumber,
                target: 10
            }
        };
    }
}
