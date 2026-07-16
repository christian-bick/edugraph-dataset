import { ProblemGenerator, GeneratorInput, ProblemStub, AbstractProblem } from "../../types/ml-engine.ts";
import { GeometryEnvShapesProblem } from "../../types/problems.ts";

export class GeometryEnvShapesGenerator implements ProblemGenerator<GeometryEnvShapesProblem> {
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
                target,
                answer
            }
        };
    }
}
