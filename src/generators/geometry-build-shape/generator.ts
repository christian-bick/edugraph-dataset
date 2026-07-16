import { ProblemGenerator, GeneratorInput, ProblemStub, AbstractProblem } from "../../types/ml-engine.ts";
import { GeometryBuildShapeProblem } from "../../types/problems.ts";

export class GeometryBuildShapeGenerator implements ProblemGenerator<GeometryBuildShapeProblem> {
    type: AbstractProblem['type'] = 'geometry';

    generate(input: GeneratorInput): ProblemStub | null {
        const { constraints } = input;


        const target = constraints.target || 'triangle'; // triangle, square, rectangle
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
