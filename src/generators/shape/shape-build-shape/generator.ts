import {AbstractProblem, ProblemGenerator, ProblemStub} from "../../../types/ml-engine.ts";
import {ShapeBuildShapeProblem} from "../../../types/problems.ts";
import {ShapeBuildShapeGeneratorConfig, ShapeBuildShapeGeneratorSchema} from "./spec.ts";
import {Area} from 'edugraph-ts';
import {validateConfigFields} from "../../../lib/errors.ts";

export class ShapeBuildShapeGenerator implements ProblemGenerator<ShapeBuildShapeProblem, ShapeBuildShapeGeneratorConfig> {
    type: AbstractProblem['type'] = 'shape';
    schema = ShapeBuildShapeGeneratorSchema;

    generate(config: ShapeBuildShapeGeneratorConfig): ProblemStub<ShapeBuildShapeProblem> | null {
        validateConfigFields('shape-build-shape', config, ['target']);
        const targetLabel = config.target!;
        
        let target: string;
        let sides: number;
        let corners: number;
        let definingAttributes: string[];

        if (targetLabel === Area.Triangle) {
            target = 'triangle';
            sides = 3;
            corners = 3;
            definingAttributes = ['3 straight sides', '3 corners', 'a closed outline'];
        } else if (targetLabel === Area.Square) {
            target = 'square';
            sides = 4;
            corners = 4;
            definingAttributes = ['4 equal straight sides', '4 corners', '4 square corners'];
        } else if (targetLabel === Area.Rectangle) {
            target = 'rectangle';
            sides = 4;
            corners = 4;
            definingAttributes = ['4 straight sides', '4 square corners', 'opposite sides equal'];
        } else {
            target = 'hexagon';
            sides = 6;
            corners = 6;
            definingAttributes = ['6 straight sides', '6 corners', 'a closed outline'];
        }

        const attributes = [
            ...definingAttributes.map(label => ({label, defining: true})),
            {label: 'its color', defining: false},
            {label: 'its size', defining: false},
            {label: 'the direction it points', defining: false}
        ];

        return {
            data: {
                target,
                sides,
                corners,
                attributes
            }
        };
    }
}
