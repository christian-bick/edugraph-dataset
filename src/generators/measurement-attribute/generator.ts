import {AbstractProblem, ProblemGenerator, ProblemStub} from "../../types/ml-engine.ts";
import {MeasurementAttributeProblem} from "../../types/problems.ts";
import {Scope} from "edugraph-ts";
import {MeasurementAttributeGeneratorConfig, MeasurementAttributeGeneratorSchema} from "./spec.ts";

export class MeasurementAttributeGenerator implements ProblemGenerator<MeasurementAttributeProblem, MeasurementAttributeGeneratorConfig> {
    type: AbstractProblem['type'] = 'measurement';
    schema = MeasurementAttributeGeneratorSchema;

    generate(config: MeasurementAttributeGeneratorConfig): ProblemStub | null {
        const attributeLabel = config.attribute;

        if (!attributeLabel) return null;

        const attribute = attributeLabel === Scope.LengthMeasurement ? 'length' : 'weight';

        return {
            id: `measurement-attribute-${attribute}`,
            data: {
                attribute: attribute // height is just a variant of length usually
            }
        };
    }
}
