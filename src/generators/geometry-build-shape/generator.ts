import {AbstractProblem, ProblemGenerator, ProblemStub} from "../../types/ml-engine.ts";
import {GeometryBuildShapeProblem} from "../../types/problems.ts";
import {random} from "../../lib/random.ts";
import {GeometryBuildShapeGeneratorConfig, GeometryBuildShapeGeneratorSchema} from "./spec.ts";
import {Area} from 'edugraph-ts';

export class GeometryBuildShapeGenerator implements ProblemGenerator<GeometryBuildShapeProblem, GeometryBuildShapeGeneratorConfig> {
    type: AbstractProblem['type'] = 'geometry';
    schema = GeometryBuildShapeGeneratorSchema;

    generate(config: GeometryBuildShapeGeneratorConfig): ProblemStub | null {
        const targetLabel = config.target || [Area.Triangle, Area.Square, Area.Rectangle, Area.Hexagon][Math.floor(random() * 4)];
        
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
            id: `geometry-build-${target}`,
            data: {
                target,
                sides,
                corners
            }
        };
    }
}
