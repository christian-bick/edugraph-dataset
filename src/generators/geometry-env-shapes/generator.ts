import {AbstractProblem, ProblemGenerator, ProblemStub} from "../../types/ml-engine.ts";
import {GeometryEnvShapesProblem} from "../../types/problems.ts";
import {random} from "../../lib/random.ts";
import {GeometryEnvShapesGeneratorConfig, GeometryEnvShapesGeneratorSchema} from "./spec.ts";

export class GeometryEnvShapesGenerator implements ProblemGenerator<GeometryEnvShapesProblem, GeometryEnvShapesGeneratorConfig> {
    type: AbstractProblem['type'] = 'geometry';
    schema = GeometryEnvShapesGeneratorSchema;

    generate(config: GeometryEnvShapesGeneratorConfig): ProblemStub | null {
        const validShapes: string[] = [];
        if (config.wantsCircle) validShapes.push('circle');
        if (config.wantsSquare) validShapes.push('square');
        if (config.wantsRectangle) validShapes.push('rectangle');
        
        if (validShapes.length === 0) {
            validShapes.push('circle', 'square', 'rectangle');
        }

        const answer = validShapes[Math.floor(random() * validShapes.length)];
        
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
