import {AbstractProblem, GeneratorInput, ProblemGenerator, ProblemStub} from "../../types/ml-engine.ts";
import {GeometryComposeShapesProblem} from "../../types/problems.ts";
import {Area} from "edugraph-ts";
import {isSubConceptOf} from "../../lib/ontology.ts";
import {random} from "../../lib/random.ts";

export class GeometryComposeShapesGenerator implements ProblemGenerator<GeometryComposeShapesProblem> {
    type: AbstractProblem['type'] = 'geometry';

    generate(input: GeneratorInput): ProblemStub | null {
        const { labels } = input;

        const validTargets: string[] = [];
        const validComponents: string[] = [];
        
        if (!labels || labels.length === 0) {
            validTargets.push('rectangle', 'square');
            validComponents.push('triangles');
        } else {
            if (labels.some(l => isSubConceptOf(l, Area.Rectangle))) validTargets.push('rectangle');
            if (labels.some(l => isSubConceptOf(l, Area.Square))) validTargets.push('square');
            if (labels.some(l => isSubConceptOf(l, Area.Triangle))) validComponents.push('triangles');
            if (labels.some(l => isSubConceptOf(l, Area.Rectangle))) validComponents.push('rectangles');
            
            if (validTargets.length === 0) validTargets.push('rectangle', 'square');
            if (validComponents.length === 0) validComponents.push('triangles');
        }

        const target = validTargets[Math.floor(random() * validTargets.length)];
        const components = [validComponents[Math.floor(random() * validComponents.length)]];
        const answer = 'triangle';

        return {
            id: `geometry-compose-${target}`,
            data: {
                target,
                components,
                answer
            }
        };
    }
}
