import { ProblemGenerator, GeneratorInput, ProblemStub, AbstractProblem } from "../../types/ml-engine.ts";
import { GeometryProblem } from "../../types/problems.ts";

export class GeometryComposeShapesGenerator implements ProblemGenerator<GeometryProblem> {
    type: AbstractProblem['type'] = 'geometry';

    generate(input: GeneratorInput): ProblemStub | null {
        const { constraints } = input;

        // Guard
        if (constraints.mode && constraints.mode !== 'compose-shapes') {
            return null;
        }

        const target = constraints.target || 'rectangle'; // rectangle, square
        const components = constraints.components || ['triangles']; // triangles, rectangles
        const answer = 'Two triangles';

        return {
            id: `geometry-compose-${target}`,
            data: {
                mode: 'compose-shapes',
                target,
                components,
                answer
            }
        };
    }
}
