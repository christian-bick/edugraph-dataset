import {AbstractProblem, ProblemGenerator, ProblemStub} from "../../../types/ml-engine.ts";
import {GeometrySameAttributeProblem} from "../../../types/problems.ts";
import {random} from "../../../lib/random.ts";
import {GeometrySameAttributeGeneratorConfig, GeometrySameAttributeGeneratorSchema} from "./spec.ts";
import {validateConfigFields} from "../../../lib/errors.ts";

export class GeometrySameAttributeGenerator implements ProblemGenerator<GeometrySameAttributeProblem, GeometrySameAttributeGeneratorConfig> {
    type: AbstractProblem['type'] = 'geometry';
    schema = GeometrySameAttributeGeneratorSchema;

    generate(config: GeometrySameAttributeGeneratorConfig): ProblemStub | null {
        validateConfigFields('geometry-same-attribute', config, ['shapes']);
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
            id: `geometry-same-attr-${attribute}-${answer}`,
            data: {
                attribute,
                answer
            },
            tags: [selectedShape]
        };
    }
}
