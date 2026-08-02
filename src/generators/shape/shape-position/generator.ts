import {AbstractProblem, ProblemGenerator, ProblemStub} from "../../../types/ml-engine.ts";
import {ShapePositionProblem} from "../../../types/problems.ts";
import {random} from "../../../lib/random.ts";
import {Scope} from "edugraph-ts";
import {ShapePositionGeneratorConfig, ShapePositionGeneratorSchema} from "./spec.ts";
import {validateConfigFields} from "../../../lib/errors.ts";

export class ShapePositionGenerator implements ProblemGenerator<ShapePositionProblem, ShapePositionGeneratorConfig> {
    type: AbstractProblem['type'] = 'shape';
    schema = ShapePositionGeneratorSchema;

    generate(config: ShapePositionGeneratorConfig): ProblemStub | null {
        validateConfigFields('shape-position', config, ['relations']);
        const relations = config.relations!;

        const possible: string[] = [];
        if (relations.includes(Scope.Above)) possible.push('above');
        if (relations.includes(Scope.Below)) possible.push('below');
        if (relations.includes(Scope.Beside)) possible.push('beside');
        if (relations.includes(Scope.Behind)) possible.push('behind');
        if (relations.includes(Scope.Ahead)) possible.push('ahead');

        if (possible.length === 0) {
            return null;
        }

        const relation = possible[Math.floor(random() * possible.length)];
        const answer = relation;

        return {
            data: {
                relation,
                answer
            }
        };
    }
}
