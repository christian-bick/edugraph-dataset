import {AbstractProblem, ProblemGenerator, ProblemStub} from "../../../types/ml-engine.ts";
import {ShapeBuildShapeProblem} from "../../../types/problems.ts";
import {ShapeBuildShapeGeneratorConfig, ShapeBuildShapeGeneratorSchema} from "./spec.ts";
import {Scope} from 'edugraph-ts';
import {validateConfigFields} from "../../../lib/errors.ts";
import {getShapeDefinition, shapeNameFromLabel} from '../helpers.ts';

export class ShapeBuildShapeGenerator implements ProblemGenerator<ShapeBuildShapeProblem, ShapeBuildShapeGeneratorConfig> {
    type: AbstractProblem['type'] = 'shape';
    schema = ShapeBuildShapeGeneratorSchema;

    generate(config: ShapeBuildShapeGeneratorConfig): ProblemStub<ShapeBuildShapeProblem> | null {
        validateConfigFields('shape-build-shape', config, [
            'target',
            'attributeScope',
            'specifyAttributes'
        ]);

        const target = shapeNameFromLabel(config.target!);
        if (!target) return null;

        const definition = getShapeDefinition(target);
        const construction = {
            target,
            sides: definition.sideCount,
            corners: definition.vertexCount
        };

        if (config.attributeScope === Scope.ShapeProperties && !config.specifyAttributes) {
            return {data: construction, tags: []};
        }

        if (config.attributeScope === Scope.ShapeAttributes && config.specifyAttributes) {
            return {
                data: {
                    ...construction,
                    task: 'specify-attributes',
                    definition
                },
                tags: []
            };
        }

        return null;
    }
}
