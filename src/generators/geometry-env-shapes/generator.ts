import { ProblemGenerator, GeneratorInput, ProblemStub, AbstractProblem } from "../../types/ml-engine.ts";
import { GeometryProblem } from "../../types/problems.ts";

export class GeometryEnvShapesGenerator implements ProblemGenerator<GeometryProblem> {
    type: AbstractProblem['type'] = 'geometry';

    generate(input: GeneratorInput): ProblemStub | null {
        const { constraints } = input;

        // Guard
        if (constraints.mode && constraints.mode !== 'env-shapes') {
            return null;
        }

        const target = constraints.target || 'clock'; // clock, window, table
        const shapesMap: Record<string, string> = {
            clock: 'circle',
            window: 'square',
            table: 'rectangle'
        };
        const answer = shapesMap[target];

        return {
            id: `geometry-env-shapes-${target}`,
            data: {
                mode: 'env-shapes',
                target,
                answer
            }
        };
    }
}
