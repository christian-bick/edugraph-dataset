import { ProblemGenerator, GeneratorInput, ProblemStub, AbstractProblem } from "../../types/ml-engine.ts";
import { GeometryName2dProblem } from "../../types/problems.ts";
import { random } from "../../lib/random.ts";

export class GeometryGenerator implements ProblemGenerator<GeometryName2dProblem> {
    type: AbstractProblem['type'] = 'geometry';

    generate(input: GeneratorInput): ProblemStub | null {
        const { constraints } = input;

        // Guard
        const mode = constraints.mode || 'name-2d';
        if (mode !== 'name-2d') {
            return null;
        }

        const shape = constraints.shape || 'triangle'; // square, circle, triangle, rectangle, hexagon
        const rotation = constraints.rotation !== undefined ? constraints.rotation : Math.floor(random() * 360);
        const scale = constraints.scale !== undefined ? constraints.scale : parseFloat((random() * 1.0 + 0.5).toFixed(1)); // 0.5 to 1.5

        return {
            id: `geometry-name-2d-${shape}-${rotation}-${scale}`.replace('.', '-'),
            data: {
                shape,
                rotation,
                scale,
                answer: shape
            }
        };
    }
}
