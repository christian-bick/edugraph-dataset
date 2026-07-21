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
        } else {
            return null;
        }
        
        const envMap: Record<string, string> = {
            circle: 'clock',
            square: 'window',
            rectangle: 'table'
        };
        const target = envMap[answer];

        return {
            id: `shape-env-shapes-${target}`,
            data: {
                target,
                answer
            },
            tags: [label]
        };
    }
}
