import {AbstractProblem, GeneratorInput, ProblemGenerator, ProblemStub} from "../../types/ml-engine.ts";
import {GeometryNamingProblem} from "../../types/problems.ts";
import {random} from "../../lib/random.ts";
import {Area} from "edugraph-ts";
import {isSubConceptOf} from "../../lib/ontology.ts";

export class GeometryNamingGenerator implements ProblemGenerator<GeometryNamingProblem> {
    type: AbstractProblem['type'] = 'geometry';

    generate(input: GeneratorInput): ProblemStub | null {
        const { labels } = input;

        const validShapes: string[] = [];
        if (!labels || labels.length === 0) {
            validShapes.push('triangle', 'square', 'rectangle', 'circle', 'cube', 'sphere', 'cone', 'cylinder');
        } else {
            if (labels.some(l => isSubConceptOf(l, Area.Triangle))) validShapes.push('triangle');
            if (labels.some(l => isSubConceptOf(l, Area.Square))) validShapes.push('square');
            if (labels.some(l => isSubConceptOf(l, Area.Rectangle))) validShapes.push('rectangle');
            if (labels.some(l => isSubConceptOf(l, Area.Circle))) validShapes.push('circle');
            if (labels.some(l => isSubConceptOf(l, Area.Cube))) validShapes.push('cube');
            
            if (validShapes.length === 0) {
                validShapes.push('triangle', 'square', 'rectangle', 'circle');
            }
        }

        const shape = validShapes[Math.floor(random() * validShapes.length)];
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
