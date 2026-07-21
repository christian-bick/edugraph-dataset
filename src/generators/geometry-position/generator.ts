import {AbstractProblem, ProblemGenerator, ProblemStub} from "../../types/ml-engine.ts";
import {GeometryPositionProblem} from "../../types/problems.ts";
import {random} from "../../lib/random.ts";
import {Scope} from "edugraph-ts";
import {GeometryPositionGeneratorConfig, GeometryPositionGeneratorSchema} from "./spec.ts";
import {validateConfigFields} from "../../lib/errors.ts";

export class GeometryPositionGenerator implements ProblemGenerator<GeometryPositionProblem, GeometryPositionGeneratorConfig> {
    type: AbstractProblem['type'] = 'geometry';
    schema = GeometryPositionGeneratorSchema;

    generate(config: GeometryPositionGeneratorConfig): ProblemStub | null {
        validateConfigFields('geometry-position', config, ['relations']);
        const relations = config.relations!;

        const possible: string[] = [];
        if (relations.includes(Scope.Above)) possible.push('above');
        if (relations.includes(Scope.Below)) possible.push('below');
        if (relations.includes(Scope.Beside)) possible.push('beside');
        if (relations.includes(Scope.Behind)) possible.push('behind');

        if (possible.length === 0) {
            return null;
        }

        const relation = possible[Math.floor(random() * possible.length)];
        const answer = relation;

        const RELATION_MAP: Record<string, string> = {
            above: Scope.Above,
            below: Scope.Below,
            beside: Scope.Beside,
            behind: Scope.Behind
        };

        return {
            id: `geometry-position-${relation}`,
            data: {
                relation,
                answer
            },
            tags: [RELATION_MAP[relation]]
        };
    }
}
