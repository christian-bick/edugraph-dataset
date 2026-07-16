import {AbstractProblem, GeneratorInput, ProblemGenerator, ProblemStub} from "../../types/ml-engine.ts";
import {GeometryIdentityProblem} from "../../types/problems.ts";
import {random} from "../../lib/random.ts";
import {Area} from "edugraph-ts";
import {isSubConceptOf} from "../../lib/ontology.ts";

export class GeometryIdentityGenerator implements ProblemGenerator<GeometryIdentityProblem> {
    type: AbstractProblem['type'] = 'geometry';

    generate(input: GeneratorInput): ProblemStub | null {
        const { labels } = input;

        const validShapes: string[] = [];
        if (!labels || labels.length === 0) {
            validShapes.push('triangle', 'square', 'rectangle', 'circle', 'cube', 'sphere', 'cone', 'cylinder', 'hexagon');
        } else {
            if (labels.some(l => isSubConceptOf(l, Area.Triangle))) validShapes.push('triangle');
            if (labels.some(l => isSubConceptOf(l, Area.Square))) validShapes.push('square');
            if (labels.some(l => isSubConceptOf(l, Area.Rectangle))) validShapes.push('rectangle');
            if (labels.some(l => isSubConceptOf(l, Area.Circle))) validShapes.push('circle');
            if (labels.some(l => isSubConceptOf(l, Area.Hexagon))) validShapes.push('hexagon');
            if (labels.some(l => isSubConceptOf(l, Area.Cube))) validShapes.push('cube');
            if (labels.some(l => isSubConceptOf(l, Area.Sphere))) validShapes.push('sphere');
            if (labels.some(l => isSubConceptOf(l, Area.Cone))) validShapes.push('cone');
            if (labels.some(l => isSubConceptOf(l, Area.Cylinder))) validShapes.push('cylinder');
            
            if (validShapes.length === 0) {
                // Default fallback to basic 2D shapes
                validShapes.push('triangle', 'square', 'rectangle', 'circle');
            }
        }

        const shape = validShapes[Math.floor(random() * validShapes.length)];
        const seed = Math.floor(random() * 1000);

        return {
            id: `geometry-identity-${shape}-${seed}`,
            data: {
                shape,
                answer: shape
            }
        };
    }
}
