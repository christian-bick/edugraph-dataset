import { ProblemGenerator, GeneratorInput, ProblemStub, AbstractProblem } from "../../types/ml-engine.ts";
import { GeometryComposeShapesProblem } from "../../types/problems.ts";

export class GeometryComposeShapesGenerator implements ProblemGenerator<GeometryComposeShapesProblem> {
    type: AbstractProblem['type'] = 'geometry';

    generate(input: GeneratorInput): ProblemStub | null {
        const { constraints } = input;

        // Guard
        if (constraints.mode && constraints.mode !== 'compose-shapes') {
            return null;
        }

        const target = constraints.target || 'rectangle'; // rectangle, square
        const components = constraints.components || ['triangles']; // triangles, rectangles
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
