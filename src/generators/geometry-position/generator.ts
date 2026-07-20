import {AbstractProblem, ProblemGenerator, ProblemStub} from "../../types/ml-engine.ts";
import {GeometryPositionProblem} from "../../types/problems.ts";
import {random} from "../../lib/random.ts";
import {Scope} from "edugraph-ts";
import {GeometryPositionGeneratorConfig, GeometryPositionGeneratorSchema} from "./spec.ts";

export class GeometryPositionGenerator implements ProblemGenerator<GeometryPositionProblem, GeometryPositionGeneratorConfig> {
    type: AbstractProblem['type'] = 'geometry';
    schema = GeometryPositionGeneratorSchema;

    generate(config: GeometryPositionGeneratorConfig): ProblemStub | null {
        const relations = config.relations;

        const possible: string[] = [];
        if (relations && relations.length > 0) {
            if (relations.includes(Scope.Above)) possible.push('above');
            if (relations.includes(Scope.Below)) possible.push('below');
            if (relations.includes(Scope.Beside)) possible.push('beside');
            if (relations.includes(Scope.Behind)) possible.push('behind');
        }

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
