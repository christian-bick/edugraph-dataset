import { ProblemGenerator, GeneratorInput, ProblemStub, AbstractProblem } from "../../types/ml-engine.ts";
import { GeometryProblem } from "../../types/problems.ts";

export class GeometryBuildShapeGenerator implements ProblemGenerator<GeometryProblem> {
    type: AbstractProblem['type'] = 'geometry';

    generate(input: GeneratorInput): ProblemStub | null {
        const { constraints } = input;

        // Guard
        if (constraints.mode && constraints.mode !== 'build-shape') {
            return null;
        }

        const target = constraints.target || 'triangle'; // triangle, square, rectangle
        const sidesMap: Record<string, number> = { triangle: 3, square: 4, rectangle: 4 };
        const cornersMap: Record<string, number> = { triangle: 3, square: 4, rectangle: 4 };
        const sides = sidesMap[target];
        const corners = cornersMap[target];

        return {
            id: `geometry-build-${target}`,
            data: {
                mode: 'build-shape',
                target,
                sides,
                corners,
                answer: `${sides} sticks, ${corners} balls`
            }
        };
    }
}
