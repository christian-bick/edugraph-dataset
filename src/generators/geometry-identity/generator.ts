import {AbstractProblem, ProblemGenerator, ProblemStub} from "../../types/ml-engine.ts";
import {GeometryIdentityProblem} from "../../types/problems.ts";
import {random} from "../../lib/random.ts";
import {Area} from "edugraph-ts";
import {GeometryIdentityGeneratorConfig, GeometryIdentityGeneratorSchema} from "./spec.ts";

export class GeometryIdentityGenerator implements ProblemGenerator<GeometryIdentityProblem, GeometryIdentityGeneratorConfig> {
    type: AbstractProblem['type'] = 'geometry';
    schema = GeometryIdentityGeneratorSchema;

    generate(config: GeometryIdentityGeneratorConfig): ProblemStub | null {
        let validShapes = config.shapes || [];

        if (validShapes.length === 0) {
            // Default fallback to basic 2D shapes
            validShapes = [Area.Triangle, Area.Square, Area.Rectangle, Area.Circle];
        }

        const shape = validShapes[Math.floor(random() * validShapes.length)];
        const seed = Math.floor(random() * 1000);

        return {
            id: `geometry-identity-${shape}-${seed}`,
            data: {
                shape,
                answer: shape
            }
        };
    }
}
