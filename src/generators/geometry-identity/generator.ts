import {AbstractProblem, ProblemGenerator, ProblemStub} from "../../types/ml-engine.ts";
import {GeometryIdentityProblem} from "../../types/problems.ts";
import {random} from "../../lib/random.ts";
import {Area} from "edugraph-ts";
import {GeometryIdentityGeneratorConfig, GeometryIdentityGeneratorSchema} from "./spec.ts";

export class GeometryIdentityGenerator implements ProblemGenerator<GeometryIdentityProblem, GeometryIdentityGeneratorConfig> {
    type: AbstractProblem['type'] = 'geometry';
    schema = GeometryIdentityGeneratorSchema;

    generate(config: GeometryIdentityGeneratorConfig): ProblemStub | null {
        const validShapes = config.shapes && config.shapes.length > 0
            ? config.shapes
            : [
                Area.Triangle,
                Area.Square,
                Area.Rectangle,
                Area.Circle
            ];

        const selectedArea = validShapes[Math.floor(random() * validShapes.length)];
        const shape = selectedArea.split('/').pop()!.toLowerCase();

        const randomSuffix = Math.floor(random() * 1000000);
        return {
            id: `geometry-identity-${shape}-${randomSuffix}`,
            data: {
                shape,
                answer: shape
            }
        };
    }
}

