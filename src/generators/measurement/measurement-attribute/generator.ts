import {AbstractProblem, ProblemGenerator, ProblemStub} from "../../../types/ml-engine.ts";
import {MeasurementAttributeProblem} from "../../../types/problems.ts";
import {random} from "../../../lib/random.ts";
import {Scope} from "edugraph-ts";
import {MeasurementAttributeGeneratorConfig, MeasurementAttributeGeneratorSchema} from "./spec.ts";
import {validateConfigFields} from "../../../lib/errors.ts";

export class MeasurementAttributeGenerator implements ProblemGenerator<MeasurementAttributeProblem, MeasurementAttributeGeneratorConfig> {
    type: AbstractProblem['type'] = 'measurement';
    schema = MeasurementAttributeGeneratorSchema;

    generate(config: MeasurementAttributeGeneratorConfig): ProblemStub | null {
        validateConfigFields('measurement-attribute', config, ['attribute']);
        const attributeLabel = config.attribute;

        let attribute: 'length' | 'height' | 'weight';
        if (attributeLabel === Scope.LengthMeasurement) {
            attribute = random() > 0.5 ? 'length' : 'height';
        } else {
            attribute = 'weight';
        }

        return {
            id: `measurement-attribute-${attribute}`,
            data: {
                attribute: attribute
            }
        };
    }
}
