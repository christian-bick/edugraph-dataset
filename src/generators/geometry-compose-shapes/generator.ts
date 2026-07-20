import {AbstractProblem, ProblemGenerator, ProblemStub} from "../../types/ml-engine.ts";
import {GeometryComposeShapesProblem} from "../../types/problems.ts";
import {random} from "../../lib/random.ts";
import {GeometryComposeShapesGeneratorConfig, GeometryComposeShapesGeneratorSchema} from "./spec.ts";
import {Area} from "edugraph-ts";

export class GeometryComposeShapesGenerator implements ProblemGenerator<GeometryComposeShapesProblem, GeometryComposeShapesGeneratorConfig> {
    type: AbstractProblem['type'] = 'geometry';
    schema = GeometryComposeShapesGeneratorSchema;

    generate(config: GeometryComposeShapesGeneratorConfig): ProblemStub | null {
        const label = config.classify;
        
        let target: 'rectangle' | 'square';
        
        if (label === Area.Rectangle) {
            target = 'rectangle';
        } else if (label === Area.Square) {
            target = 'square';
        } else {
            target = random() > 0.5 ? 'rectangle' : 'square';
        }

        const components = ['triangles'];
        const answer = 'triangle';

        return {
            id: `geometry-compose-${target}`,
            data: {
                target,
                components,
                answer
            }
        };
    }
}
