import {AbstractProblem, ProblemGenerator, ProblemStub} from "../../types/ml-engine.ts";
import {GeometryBuildShapeProblem} from "../../types/problems.ts";
import {random} from "../../lib/random.ts";
import {GeometryBuildShapeGeneratorConfig, GeometryBuildShapeGeneratorSchema} from "./spec.ts";

export class GeometryBuildShapeGenerator implements ProblemGenerator<GeometryBuildShapeProblem, GeometryBuildShapeGeneratorConfig> {
    type: AbstractProblem['type'] = 'geometry';
    schema = GeometryBuildShapeGeneratorSchema;

    generate(config: GeometryBuildShapeGeneratorConfig): ProblemStub | null {
        const validTargets: string[] = [];
        if (config.wantsTriangle) validTargets.push('triangle');
        if (config.wantsSquare) validTargets.push('square');
        if (config.wantsRectangle) validTargets.push('rectangle');
        
        if (validTargets.length === 0) {
            validTargets.push('triangle', 'square', 'rectangle');
        }

        const target = validTargets[Math.floor(random() * validTargets.length)];
        const sidesMap: Record<string, number> = { triangle: 3, square: 4, rectangle: 4 };
        const cornersMap: Record<string, number> = { triangle: 3, square: 4, rectangle: 4 };
        const sides = sidesMap[target];
        const corners = cornersMap[target];

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
