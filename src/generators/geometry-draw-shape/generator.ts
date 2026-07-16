import {AbstractProblem, GeneratorInput, ProblemGenerator, ProblemStub} from "../../types/ml-engine.ts";
import {GeometryDrawShapeProblem} from "../../types/problems.ts";
import {Area} from "edugraph-ts";
import {isSubConceptOf} from "../../lib/ontology.ts";
import {random} from "../../lib/random.ts";

export class GeometryDrawShapeGenerator implements ProblemGenerator<GeometryDrawShapeProblem> {
    type: AbstractProblem['type'] = 'geometry';

    generate(input: GeneratorInput): ProblemStub | null {
        const { labels } = input;

        const validTargets: string[] = [];
        if (!labels || labels.length === 0) {
            validTargets.push('circle', 'triangle', 'square');
        } else {
            if (labels.some(l => isSubConceptOf(l, Area.Circle))) validTargets.push('circle');
            if (labels.some(l => isSubConceptOf(l, Area.Triangle))) validTargets.push('triangle');
            if (labels.some(l => isSubConceptOf(l, Area.Square))) validTargets.push('square');
            if (labels.some(l => isSubConceptOf(l, Area.Rectangle))) validTargets.push('rectangle');
            if (validTargets.length === 0) {
                validTargets.push('circle', 'triangle', 'square');
            }
        }

        const target = validTargets[Math.floor(random() * validTargets.length)];

        return {
            id: `geometry-draw-${target}`,
            data: {
                target,
                answer: target
            }
        };
    }
}
