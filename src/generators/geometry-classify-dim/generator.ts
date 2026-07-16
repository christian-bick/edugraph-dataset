import { ProblemGenerator, GeneratorInput, ProblemStub, AbstractProblem } from "../../types/ml-engine.ts";
import { GeometryClassifyDimProblem } from "../../types/problems.ts";
import { random } from "../../lib/random.ts";

export class GeometryClassifyDimGenerator implements ProblemGenerator<GeometryClassifyDimProblem> {
    type: AbstractProblem['type'] = 'geometry';

    generate(input: GeneratorInput): ProblemStub | null {
        const { constraints } = input;

        // Guard
        if (constraints.mode && constraints.mode !== 'classify-dim') {
            return null;
        }

        const shapeType = constraints.shapeType || '2d'; // 2d, 3d
        const shapes2D = ['circle', 'square', 'triangle', 'rectangle', 'hexagon'];
        const shapes3D = ['cube', 'cone', 'cylinder', 'sphere'];
        const list = shapeType === '2d' ? shapes2D : shapes3D;
        const shape = list[Math.floor(random() * list.length)];
        const answer = shapeType === '2d' ? 'Flat (2D)' : 'Solid (3D)';

        return {
            id: `geometry-classify-dim-${shapeType}-${shape}`,
            data: {
                shapeType,
                shape,
                answer
            }
        };
    }
}
