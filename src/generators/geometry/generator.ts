import { ProblemGenerator, GeneratorInput, ProblemStub, AbstractProblem } from "../../types/ml-engine.ts";
import { GeometryNamingProblem } from "../../types/problems.ts";
import { random } from "../../lib/random.ts";

export class GeometryGenerator implements ProblemGenerator<GeometryNamingProblem> {
    type: AbstractProblem['type'] = 'geometry';

    generate(input: GeneratorInput): ProblemStub | null {
        const { constraints } = input;

        // Guard
        const mode = constraints.mode || 'name-2d';
        if (mode !== 'name-2d' && mode !== 'name-3d') {
            return null;
        }

        const shape = constraints.shape || (mode === 'name-2d' ? 'triangle' : 'cube');
        const seed = Math.floor(random() * 1000);

        return {
            id: `geometry-${mode}-${shape}-${seed}`,
            data: {
                shape,
                answer: shape
            }
        };
    }
}
