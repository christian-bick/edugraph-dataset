import { ProblemGenerator, GeneratorInput, ProblemStub, AbstractProblem } from "../../types/ml-engine.ts";
import { GeometryProblem } from "../../types/problems.ts";

export class GeometryPositionGenerator implements ProblemGenerator<GeometryProblem> {
    type: AbstractProblem['type'] = 'geometry';

    generate(input: GeneratorInput): ProblemStub | null {
        const { constraints } = input;

        // Guard
        if (constraints.mode && constraints.mode !== 'position') {
            return null;
        }

        const relation = constraints.relation || 'above'; // above, below, beside, nextTo
        const answer = relation; // The correct relation is the target

        return {
            id: `geometry-position-${relation}`,
            data: {
                mode: 'position',
                relation,
                answer
            }
        };
    }
}
