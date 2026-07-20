import {AbstractProblem, ProblemGenerator, ProblemStub} from "../../types/ml-engine.ts";
import {GeometryEnvShapesProblem} from "../../types/problems.ts";
import {random} from "../../lib/random.ts";
import {GeometryEnvShapesGeneratorConfig, GeometryEnvShapesGeneratorSchema} from "./spec.ts";
import {Area} from "edugraph-ts";

export class GeometryEnvShapesGenerator implements ProblemGenerator<GeometryEnvShapesProblem, GeometryEnvShapesGeneratorConfig> {
    type: AbstractProblem['type'] = 'geometry';
    schema = GeometryEnvShapesGeneratorSchema;

    generate(config: GeometryEnvShapesGeneratorConfig): ProblemStub | null {
        const label = config.classify;
        
        let answer: string;
        
        if (label === Area.Circle) {
            answer = 'circle';
        } else if (label === Area.Square) {
            answer = 'square';
        } else if (label === Area.Rectangle) {
            answer = 'rectangle';
        } else {
            const allShapes = ['circle', 'square', 'rectangle'];
            answer = allShapes[Math.floor(random() * allShapes.length)];
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
            }
        };
    }
}
