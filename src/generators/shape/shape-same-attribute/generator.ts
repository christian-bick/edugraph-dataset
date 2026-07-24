import {AbstractProblem, ProblemGenerator, ProblemStub} from "../../../types/ml-engine.ts";
import {ShapeSameAttributeProblem} from "../../../types/problems.ts";
import {random} from "../../../lib/random.ts";
import {ShapeSameAttributeGeneratorConfig, ShapeSameAttributeGeneratorSchema} from "./spec.ts";
import {validateConfigFields} from "../../../lib/errors.ts";

export class ShapeSameAttributeGenerator implements ProblemGenerator<ShapeSameAttributeProblem, ShapeSameAttributeGeneratorConfig> {
    type: AbstractProblem['type'] = 'shape';
    schema = ShapeSameAttributeGeneratorSchema;

    generate(config: ShapeSameAttributeGeneratorConfig): ProblemStub | null {
        validateConfigFields('shape-same-attribute', config, ['shapes']);
        const shapes = config.shapes!;

        const selectedShape = shapes[Math.floor(random() * shapes.length)];
        const shape = selectedShape.split('/').pop()!.toLowerCase();

        let attribute: 'rollable' | 'stackable' | 'foldable' = 'rollable';
        if (shape === 'sphere') {
            attribute = 'rollable';
        } else if (shape === 'cube') {
            attribute = 'stackable';
        } else if (shape === 'rectangle' || shape === 'rectangularprism') {
            attribute = 'foldable';
        }

        const answer = shape;

        return {
            data: {
                attribute,
                answer
            },
            tags: [selectedShape]
        };
    }
}
