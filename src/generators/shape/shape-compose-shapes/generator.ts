import {AbstractProblem, ProblemGenerator, ProblemStub} from "../../../types/ml-engine.ts";
import {ShapeComposeShapesProblem} from "../../../types/problems.ts";
import {ShapeComposeShapesGeneratorConfig, ShapeComposeShapesGeneratorSchema} from "./spec.ts";
import {Area} from "edugraph-ts";
import {validateConfigFields} from "../../../lib/errors.ts";

export class ShapeComposeShapesGenerator implements ProblemGenerator<ShapeComposeShapesProblem, ShapeComposeShapesGeneratorConfig> {
    type: AbstractProblem['type'] = 'shape';
    schema = ShapeComposeShapesGeneratorSchema;

    generate(config: ShapeComposeShapesGeneratorConfig): ProblemStub | null {
        validateConfigFields('shape-compose-shapes', config, ['classify']);
        const label = config.classify;
        
        let target: 'rectangle' | 'square';
        
        if (label === Area.Rectangle) {
            target = 'rectangle';
        } else if (label === Area.Square) {
            target = 'square';
        } else {
            return null;
        }

        const components = ['triangles'];
        const answer = 'triangle';

        return {
            id: `shape-compose-${target}`,
            data: {
                target,
                components,
                answer
            },
            tags: [label, Area.Triangle]
        };
    }
}
