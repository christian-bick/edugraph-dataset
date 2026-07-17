import {AbstractProblem, ProblemGenerator, ProblemStub} from "../../types/ml-engine.ts";
import {GeometryClassifyDimProblem} from "../../types/problems.ts";
import {random} from "../../lib/random.ts";
import {GeometryClassifyDimGeneratorConfig, GeometryClassifyDimGeneratorSchema} from "./spec.ts";

export class GeometryClassifyDimGenerator implements ProblemGenerator<GeometryClassifyDimProblem, GeometryClassifyDimGeneratorConfig> {
    type: AbstractProblem['type'] = 'geometry';
    schema = GeometryClassifyDimGeneratorSchema;

    generate(config: GeometryClassifyDimGeneratorConfig): ProblemStub | null {
        const validTypes: ('2d' | '3d')[] = [];
        if (config.wants2D) validTypes.push('2d');
        if (config.wants3D) validTypes.push('3d');
        if (validTypes.length === 0) {
            validTypes.push('2d', '3d');
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
