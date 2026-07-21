import {AbstractProblem, ProblemGenerator, ProblemStub} from "../../../types/ml-engine.ts";
import {ShapeBuildShapeProblem} from "../../../types/problems.ts";
import {ShapeBuildShapeGeneratorConfig, ShapeBuildShapeGeneratorSchema} from "./spec.ts";
import {Area} from 'edugraph-ts';
import {validateConfigFields} from "../../../lib/errors.ts";

export class ShapeBuildShapeGenerator implements ProblemGenerator<ShapeBuildShapeProblem, ShapeBuildShapeGeneratorConfig> {
    type: AbstractProblem['type'] = 'shape';
    schema = ShapeBuildShapeGeneratorSchema;

    generate(config: ShapeBuildShapeGeneratorConfig): ProblemStub | null {
        validateConfigFields('shape-build-shape', config, ['target']);
        const targetLabel = config.target!;
        
        let target: string;
        let sides: number;
        let corners: number;

        if (targetLabel === Area.Triangle) {
            target = 'triangle';
            sides = 3;
            corners = 3;
        } else if (targetLabel === Area.Square) {
            target = 'square';
            sides = 4;
            corners = 4;
        } else if (targetLabel === Area.Rectangle) {
            target = 'rectangle';
            sides = 4;
            corners = 4;
        } else {
            target = 'hexagon';
            sides = 6;
            corners = 6;
        }

        return {
            id: `shape-build-${target}`,
            data: {
                target,
                sides,
                corners
            },
            tags: [targetLabel]
        };
    }
}
