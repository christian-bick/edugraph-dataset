import {AbstractProblem, ProblemGenerator, ProblemStub} from "../../../types/ml-engine.ts";
import {ShapeSameAttributeProblem} from "../../../types/problems.ts";
import {random} from "../../../lib/random.ts";
import {ShapeSameAttributeGeneratorConfig, ShapeSameAttributeGeneratorSchema} from "./spec.ts";
import {validateConfigFields} from "../../../lib/errors.ts";
import {Area, Scope} from 'edugraph-ts';

const SHAPE_RELATIONS: Readonly<Record<string, {
    answer: ShapeSameAttributeProblem['answer'];
    attribute: ShapeSameAttributeProblem['attribute'];
    property: string;
}>> = {
    [Area.Sphere]: {answer: 'sphere', attribute: 'rollable', property: Scope.Rollable},
    [Area.Cube]: {answer: 'cube', attribute: 'stackable', property: Scope.Stackable},
    [Area.Rectangle]: {answer: 'rectangle', attribute: 'foldable', property: Scope.Foldable}
};

export class ShapeSameAttributeGenerator implements ProblemGenerator<ShapeSameAttributeProblem, ShapeSameAttributeGeneratorConfig> {
    type: AbstractProblem['type'] = 'shape';
    schema = ShapeSameAttributeGeneratorSchema;

    generate(config: ShapeSameAttributeGeneratorConfig): ProblemStub<ShapeSameAttributeProblem> | null {
        validateConfigFields('shape-same-attribute', config, ['shapes', 'property']);
        const shapes = config.shapes!;
        const properties = config.property!;

        const selectedShape = shapes[Math.floor(random() * shapes.length)];
        const relation = SHAPE_RELATIONS[selectedShape];
        if (!relation) return null;

        if (!properties.includes(relation.property)) {
            return null;
        }

        return {
            data: {
                attribute: relation.attribute,
                answer: relation.answer
            }
        };
    }
}
