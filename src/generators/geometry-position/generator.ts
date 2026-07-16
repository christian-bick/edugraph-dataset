import {AbstractProblem, GeneratorInput, ProblemGenerator, ProblemStub} from "../../types/ml-engine.ts";
import {GeometryPositionProblem} from "../../types/problems.ts";
import {random} from "../../lib/random.ts";

export class GeometryPositionGenerator implements ProblemGenerator<GeometryPositionProblem> {
    type: AbstractProblem['type'] = 'geometry';

    generate(input: GeneratorInput): ProblemStub | null {
        const { constraints } = input;

        const allRelations = ['above', 'below', 'beside', 'nextTo'];
        const relation = constraints.relation || allRelations[Math.floor(random() * allRelations.length)];
        const answer = relation; // The correct relation is the target

        return {
            id: `geometry-position-${relation}`,
            data: {
                relation,
                answer
            }
        };
    }
}
