import {AbstractProblem, ProblemGenerator, ProblemStub} from "../../../types/ml-engine.ts";
import {ShapeEnvShapesProblem} from "../../../types/problems.ts";
import {ShapeEnvShapesGeneratorConfig, ShapeEnvShapesGeneratorSchema} from "./spec.ts";
import {Area} from "edugraph-ts";
import {validateConfigFields} from "../../../lib/errors.ts";

export class ShapeEnvShapesGenerator implements ProblemGenerator<ShapeEnvShapesProblem, ShapeEnvShapesGeneratorConfig> {
    type: AbstractProblem['type'] = 'shape';
    schema = ShapeEnvShapesGeneratorSchema;

    generate(config: ShapeEnvShapesGeneratorConfig): ProblemStub | null {
        validateConfigFields('shape-env-shapes', config, ['classify']);
        const label = config.classify;
        
        let answer: string;
        
        if (label === Area.Circle) {
            answer = 'circle';
        } else if (label === Area.Square) {
            answer = 'square';
        } else if (label === Area.Rectangle) {
            answer = 'rectangle';
        } else if (label === Area.Triangle) {
            answer = 'triangle';
        } else if (label === Area.Hexagon) {
            answer = 'hexagon';
        } else {
            return null;
        }
        
        const envMap: Record<string, string> = {
            circle: 'clock',
            square: 'window',
            rectangle: 'table',
            triangle: 'pennant',
            hexagon: 'honeycomb cell'
        };
        const target = envMap[answer];

        return {
            data: {
                target,
                answer
            }
        };
    }
}
