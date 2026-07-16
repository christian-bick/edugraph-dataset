import { ProblemGenerator, GeneratorInput, ProblemStub, AbstractProblem } from "../../types/ml-engine.ts";
import { MeasurementAttributeProblem } from "../../types/problems.ts";
import { random } from "../../lib/random.ts";

export class MeasurementAttributeGenerator implements ProblemGenerator<MeasurementAttributeProblem> {
    type: AbstractProblem['type'] = 'measurement';

    generate(input: GeneratorInput): ProblemStub | null {
        const { constraints } = input;

        // Guard
        const mode = constraints.mode || 'attribute-type';
        if (mode !== 'attribute-type' && mode !== 'measure-attributes') {
            return null;
        }

        const attribute = constraints.attribute || (random() > 0.5 ? 'length' : 'weight'); // length, height, weight
        return {
            id: `attribute-type-${attribute}`,
            data: {
                mode: 'attribute-type',
                attribute
            }
        };
    }
}
