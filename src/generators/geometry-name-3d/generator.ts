import { ProblemGenerator, GeneratorInput, ProblemStub, AbstractProblem } from "../../types/ml-engine.ts";
import { GeometryName3dProblem } from "../../types/problems.ts";
import { random } from "../../lib/random.ts";

export class GeometryName3dGenerator implements ProblemGenerator<GeometryName3dProblem> {
    type: AbstractProblem['type'] = 'geometry';

    generate(input: GeneratorInput): ProblemStub | null {
        const { constraints } = input;

        // Guard
        if (constraints.mode && constraints.mode !== 'name-3d') {
            return null;
        }

        const shape = constraints.shape || 'cube'; // cube, cone, cylinder, sphere
        const rotation = constraints.rotation !== undefined ? constraints.rotation : Math.floor(random() * 360);
        const scale = constraints.scale !== undefined ? constraints.scale : parseFloat((random() * 1.0 + 0.5).toFixed(1));

        return {
            id: `geometry-name-3d-${shape}-${rotation}-${scale}`.replace('.', '-'),
            data: {
                shape,
                rotation,
                scale,
                answer: shape
            }
        };
    }
}
