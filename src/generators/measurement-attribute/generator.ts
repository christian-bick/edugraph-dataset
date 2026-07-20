import {AbstractProblem, ProblemGenerator, ProblemStub} from "../../types/ml-engine.ts";
import {MeasurementAttributeProblem} from "../../types/problems.ts";
import {random} from "../../lib/random.ts";
import {Scope} from "edugraph-ts";
import {MeasurementAttributeGeneratorConfig, MeasurementAttributeGeneratorSchema} from "./spec.ts";

export class MeasurementAttributeGenerator implements ProblemGenerator<MeasurementAttributeProblem, MeasurementAttributeGeneratorConfig> {
    type: AbstractProblem['type'] = 'measurement';
    schema = MeasurementAttributeGeneratorSchema;

    generate(config: MeasurementAttributeGeneratorConfig): ProblemStub | null {
        const attributeLabel = config.attribute;

        if (!attributeLabel) return null;

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
