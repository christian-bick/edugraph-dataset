import { ProblemGenerator, GeneratorInput, ProblemStub, AbstractProblem } from "../../types/ml-engine.ts";
import { GeometryNamingProblem } from "../../types/problems.ts";
import { random } from "../../lib/random.ts";

export class GeometryNamingGenerator implements ProblemGenerator<GeometryNamingProblem> {
    type: AbstractProblem['type'] = 'geometry';

    generate(input: GeneratorInput): ProblemStub | null {
        const { constraints } = input;

        const shape = constraints.shape || 'triangle';
        const seed = Math.floor(random() * 1000);

        return {
            id: `geometry-naming-${shape}-${seed}`,
            data: {
                shape,
                answer: shape
            }
        };
    }
}
