import {AbstractProblem, ProblemGenerator, ProblemStub} from "../../types/ml-engine.ts";
import {GeometryIdentityProblem} from "../../types/problems.ts";
import {random} from "../../lib/random.ts";
import {GeometryIdentityGeneratorConfig, GeometryIdentityGeneratorSchema} from "./spec.ts";
import {validateConfigFields} from "../../lib/errors.ts";

export class GeometryIdentityGenerator implements ProblemGenerator<GeometryIdentityProblem, GeometryIdentityGeneratorConfig> {
    type: AbstractProblem['type'] = 'geometry';
    schema = GeometryIdentityGeneratorSchema;

    generate(config: GeometryIdentityGeneratorConfig): ProblemStub | null {
        validateConfigFields('geometry-identity', config, ['shapes']);
        const validShapes = config.shapes!;

        const selectedArea = validShapes[Math.floor(random() * validShapes.length)];
        const shape = selectedArea.split('/').pop()!.toLowerCase();

        return {
            id: `geometry-identity-${shape}`,
            data: {
                shape,
                answer: shape
            },
            tags: [selectedArea]
        };
    }
}

