import {AbstractProblem, GeneratorInput, ProblemGenerator, ProblemStub} from "../../types/ml-engine.ts";
import {GeometryClassifyDimProblem} from "../../types/problems.ts";
import {random} from "../../lib/random.ts";
import {Area, Scope} from "edugraph-ts";
import {isSubConceptOf} from "../../lib/ontology.ts";

export class GeometryClassifyDimGenerator implements ProblemGenerator<GeometryClassifyDimProblem> {
    type: AbstractProblem['type'] = 'geometry';

    generate(input: GeneratorInput): ProblemStub | null {
        const { labels } = input;

        const validTypes: ('2d' | '3d')[] = [];
        if (!labels || labels.length === 0) {
            validTypes.push('2d', '3d');
        } else {
            if (labels.some(l => isSubConceptOf(l, Scope.TwoDimensional))) validTypes.push('2d');
            if (labels.some(l => isSubConceptOf(l, Scope.ThreeDimensional))) validTypes.push('3d');
            if (validTypes.length === 0) {
                validTypes.push('2d', '3d');
            }
        }

        const shapeType = validTypes[Math.floor(random() * validTypes.length)];
        const shapes2D = ['circle', 'square', 'triangle', 'rectangle', 'hexagon'];
        const shapes3D = ['cube', 'cone', 'cylinder', 'sphere'];
        const list = shapeType === '2d' ? shapes2D : shapes3D;
        const shape = list[Math.floor(random() * list.length)];
        const answer = shapeType as '2d' | '3d';

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
