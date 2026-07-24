import {AbstractProblem, ProblemGenerator, ProblemStub} from "../../../types/ml-engine.ts";
import {ShapeIdentityProblem} from "../../../types/problems.ts";
import {random} from "../../../lib/random.ts";
import {ShapeIdentityGeneratorConfig, ShapeIdentityGeneratorSchema} from "./spec.ts";
import {validateConfigFields} from "../../../lib/errors.ts";

export class ShapeIdentityGenerator implements ProblemGenerator<ShapeIdentityProblem, ShapeIdentityGeneratorConfig> {
    type: AbstractProblem['type'] = 'shape';
    schema = ShapeIdentityGeneratorSchema;

    generate(config: ShapeIdentityGeneratorConfig): ProblemStub | null {
        validateConfigFields('shape-identity', config, ['shapes']);
        const validShapes = config.shapes!;

        const selectedArea = validShapes[Math.floor(random() * validShapes.length)];
        const shape = selectedArea.split('/').pop()!.toLowerCase();

        return {
            data: {
                shape,
                answer: shape
            },
            tags: [selectedArea]
        };
    }
}

