import {AbstractProblem, GeneratorInput, ProblemGenerator, ProblemStub} from "../../types/ml-engine.ts";
import {GeometryPositionProblem} from "../../types/problems.ts";
import {random} from "../../lib/random.ts";
import {isSubConceptOf} from "../../lib/ontology.ts";
import {Scope} from "edugraph-ts";

export class GeometryPositionGenerator implements ProblemGenerator<GeometryPositionProblem> {
    type: AbstractProblem['type'] = 'geometry';

    generate(input: GeneratorInput): ProblemStub | null {
        const { labels = [] } = input;

        const possible: string[] = [];
        if (labels.some(l => isSubConceptOf(l, Scope.Above))) possible.push('above');
        if (labels.some(l => isSubConceptOf(l, Scope.Below))) possible.push('below');
        if (labels.some(l => isSubConceptOf(l, Scope.Beside))) possible.push('beside');
        if (labels.some(l => isSubConceptOf(l, Scope.Behind))) possible.push('behind');

        let relation = 'above';
        if (possible.length > 0) {
            relation = possible[Math.floor(random() * possible.length)];
        } else {
            const allRelations = ['above', 'below', 'beside', 'behind'];
            relation = allRelations[Math.floor(random() * allRelations.length)];
        }
        const answer = relation; // The correct relation is the target

        return {
            id: `geometry-position-${relation}`,
            data: {
                relation,
                answer
            }
        };
    }
}
