import {AbstractProblem, GeneratorInput, ProblemGenerator, ProblemStub} from "../../types/ml-engine.ts";
import {MeasurementAttributeProblem} from "../../types/problems.ts";
import {random} from "../../lib/random.ts";
import {Scope} from "edugraph-ts";
import {isSubConceptOf} from "../../lib/ontology.ts";

export class MeasurementAttributeGenerator implements ProblemGenerator<MeasurementAttributeProblem> {
    type: AbstractProblem['type'] = 'measurement';

    generate(input: GeneratorInput): ProblemStub | null {
        const { labels } = input;

        const validAttributes: ('length' | 'weight')[] = [];
        if (!labels || labels.length === 0) {
            validAttributes.push('length', 'weight');
        } else {
            if (labels.some(l => isSubConceptOf(l, Scope.LengthMeasurement))) validAttributes.push('length');
            if (labels.some(l => isSubConceptOf(l, Scope.WeightMeasurement))) validAttributes.push('weight');
            if (validAttributes.length === 0) {
                // Default fallback if no specific scope provided
                validAttributes.push('length', 'weight');
            }
        }

        const attribute = validAttributes[Math.floor(random() * validAttributes.length)];

        return {
            id: `measurement-attribute-${attribute}`,
            data: {
                attribute: attribute as 'length' | 'weight' // height is just a variant of length usually
            }
        };
    }
}
