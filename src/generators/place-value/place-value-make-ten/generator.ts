import {AbstractProblem, ProblemGenerator, ProblemStub} from "../../../types/ml-engine.ts";
import {PlaceValueMakeTenProblem} from "../../../types/problems.ts";
import {random} from "../../../lib/random.ts";
import {PlaceValueMakeTenGeneratorConfig, PlaceValueMakeTenGeneratorSchema} from "./spec.ts";
import {validateConfigFields, GeneratorValidationError} from "../../../lib/errors.ts";
import {createCanonicalNumericRange} from '../../../lib/canonical-numeric-range.ts';

export class PlaceValueMakeTenGenerator implements ProblemGenerator<PlaceValueMakeTenProblem, PlaceValueMakeTenGeneratorConfig> {
    type: AbstractProblem['type'] = 'arithmetic';
    schema = PlaceValueMakeTenGeneratorSchema;

    generate(config: PlaceValueMakeTenGeneratorConfig): ProblemStub<PlaceValueMakeTenProblem> {
        validateConfigFields('place-value-make-ten', config, ['requireZero', 'range']);
        const resolvedRange = config.range!;
        if (typeof config.requireZero !== 'boolean' || !resolvedRange || resolvedRange.max !== 10
            || ![0, 5].includes(resolvedRange.min) || config.requireZero && resolvedRange.min !== 0) {
            throw new GeneratorValidationError('place-value-make-ten', 'Unsupported canonical make-ten profile.');
        }
        const expected = createCanonicalNumericRange(10, resolvedRange.min);
        if (resolvedRange.maximumAbove !== expected.maximumAbove || resolvedRange.minimumBelow !== expected.minimumBelow) {
            throw new GeneratorValidationError('place-value-make-ten', 'Invalid canonical range witnesses.');
        }
        const target = 10;
        if (config.requireZero) {
            const zeroWitnesses = [0, target];
            const givenNumber = zeroWitnesses[Math.floor(random() * zeroWitnesses.length)];
            return {
                data: {
                    givenNumber,
                    missingNumber: target - givenNumber,
                    target
                }
            };
        }

        const givens = resolvedRange.min === 5 ? [5] : [1, 2, 3, 4, 6, 7, 8, 9];
        const givenNumber = givens[Math.floor(random() * givens.length)];
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
