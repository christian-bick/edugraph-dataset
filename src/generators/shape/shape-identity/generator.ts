import {AbstractProblem, ProblemGenerator, ProblemStub} from "../../../types/ml-engine.ts";
import {ShapeNamingProblem} from "../../../types/problems.ts";
import {random} from "../../../lib/random.ts";
import {ShapeIdentityGeneratorConfig, ShapeIdentityGeneratorSchema} from "./spec.ts";
import {validateConfigFields} from "../../../lib/errors.ts";
import {getVisibleShapeAttributes, shapeNameFromLabel} from '../helpers.ts';

export class ShapeIdentityGenerator implements ProblemGenerator<ShapeNamingProblem, ShapeIdentityGeneratorConfig> {
    type: AbstractProblem['type'] = 'shape';
    schema = ShapeIdentityGeneratorSchema;

    generate(config: ShapeIdentityGeneratorConfig): ProblemStub<ShapeNamingProblem> | null {
        validateConfigFields('shape-identity', config, ['shapes']);
        const validShapes = config.shapes!;

        const selectedArea = validShapes[Math.floor(random() * validShapes.length)];
        const planeShape = shapeNameFromLabel(selectedArea);
        const shape = planeShape ?? selectedArea.split('/').pop()!.toLowerCase();

        const data: ShapeNamingProblem = {shape};
        if (config.includeAttributes && planeShape) {
            data.attributes = getVisibleShapeAttributes(planeShape);
        }

        return {
            data
        };
    }
}
