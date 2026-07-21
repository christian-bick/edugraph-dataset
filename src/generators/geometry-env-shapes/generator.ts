import {AbstractProblem, ProblemGenerator, ProblemStub} from "../../types/ml-engine.ts";
import {GeometryEnvShapesProblem} from "../../types/problems.ts";
import {GeometryEnvShapesGeneratorConfig, GeometryEnvShapesGeneratorSchema} from "./spec.ts";
import {Area} from "edugraph-ts";
import {validateConfigFields} from "../../lib/errors.ts";

export class GeometryEnvShapesGenerator implements ProblemGenerator<GeometryEnvShapesProblem, GeometryEnvShapesGeneratorConfig> {
    type: AbstractProblem['type'] = 'geometry';
    schema = GeometryEnvShapesGeneratorSchema;

    generate(config: GeometryEnvShapesGeneratorConfig): ProblemStub | null {
        validateConfigFields('geometry-env-shapes', config, ['classify']);
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
            id: `geometry-env-shapes-${target}`,
            data: {
                target,
                answer
            },
            tags: [label]
        };
    }
}
