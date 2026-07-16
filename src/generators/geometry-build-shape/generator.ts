import {AbstractProblem, GeneratorInput, ProblemGenerator, ProblemStub} from "../../types/ml-engine.ts";
import {GeometryBuildShapeProblem} from "../../types/problems.ts";
import {Area} from "edugraph-ts";
import {isSubConceptOf} from "../../lib/ontology.ts";
import {random} from "../../lib/random.ts";

export class GeometryBuildShapeGenerator implements ProblemGenerator<GeometryBuildShapeProblem> {
    type: AbstractProblem['type'] = 'geometry';

    generate(input: GeneratorInput): ProblemStub | null {
        const { labels } = input;

        const validTargets: string[] = [];
        if (!labels || labels.length === 0) {
            validTargets.push('triangle', 'square', 'rectangle');
        } else {
            if (labels.some(l => isSubConceptOf(l, Area.Triangle))) validTargets.push('triangle');
            if (labels.some(l => isSubConceptOf(l, Area.Square))) validTargets.push('square');
            if (labels.some(l => isSubConceptOf(l, Area.Rectangle))) validTargets.push('rectangle');
            if (validTargets.length === 0) {
                validTargets.push('triangle', 'square', 'rectangle');
            }
        }

        const target = validTargets[Math.floor(random() * validTargets.length)];
        const sidesMap: Record<string, number> = { triangle: 3, square: 4, rectangle: 4 };
        const cornersMap: Record<string, number> = { triangle: 3, square: 4, rectangle: 4 };
        const sides = sidesMap[target];
        const corners = cornersMap[target];

        return {
            id: `geometry-build-${target}`,
            data: {
                target,
                sides,
                corners
            }
        };
    }
}
