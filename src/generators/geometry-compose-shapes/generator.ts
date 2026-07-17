import {AbstractProblem, ProblemGenerator, ProblemStub} from "../../types/ml-engine.ts";
import {GeometryComposeShapesProblem} from "../../types/problems.ts";
import {random} from "../../lib/random.ts";
import {GeometryComposeShapesGeneratorConfig, GeometryComposeShapesGeneratorSchema} from "./spec.ts";

export class GeometryComposeShapesGenerator implements ProblemGenerator<GeometryComposeShapesProblem, GeometryComposeShapesGeneratorConfig> {
    type: AbstractProblem['type'] = 'geometry';
    schema = GeometryComposeShapesGeneratorSchema;

    generate(config: GeometryComposeShapesGeneratorConfig): ProblemStub | null {
        const validTargets: string[] = [];
        const validComponents: string[] = [];
        
        if (config.wantsRectangle) {
            validTargets.push('rectangle');
            validComponents.push('rectangles');
        }
        if (config.wantsSquare) validTargets.push('square');
        if (config.wantsTriangle) validComponents.push('triangles');
        
        if (validTargets.length === 0) validTargets.push('rectangle', 'square');
        if (validComponents.length === 0) validComponents.push('triangles');

        const target = validTargets[Math.floor(random() * validTargets.length)];
        const components = [validComponents[Math.floor(random() * validComponents.length)]];
        const answer = 'triangle';

        return {
            id: `geometry-compose-${target}`,
            data: {
                target,
                components,
                answer
            }
        };
    }
}
