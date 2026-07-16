import { ProblemGenerator, GeneratorInput, ProblemStub, AbstractProblem } from "../../types/ml-engine.ts";
import { GeometryDrawShapeProblem } from "../../types/problems.ts";

export class GeometryDrawShapeGenerator implements ProblemGenerator<GeometryDrawShapeProblem> {
    type: AbstractProblem['type'] = 'geometry';

    generate(input: GeneratorInput): ProblemStub | null {
        const { constraints } = input;

        // Guard
        if (constraints.mode && constraints.mode !== 'draw-shape') {
            return null;
        }

        const target = constraints.target || 'circle'; // circle, triangle, square

        return {
            id: `geometry-draw-${target}`,
            data: {
                target,
                answer: target
            }
        };
    }
}
