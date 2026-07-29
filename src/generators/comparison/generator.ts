import {AbstractProblem, ProblemGenerator, ProblemStub} from "../../types/ml-engine.ts";
import {ComparisonProblem} from "../../types/problems.ts";
import {random} from "../../lib/random.ts";
import {ComparisonGeneratorConfig, ComparisonGeneratorSchema} from "./spec.ts";
import {Scope} from 'edugraph-ts';
import {validateConfigFields} from "../../lib/errors.ts";

export class ComparisonGenerator implements ProblemGenerator<ComparisonProblem, ComparisonGeneratorConfig> {
    type: AbstractProblem['type'] = 'comparison';
    schema = ComparisonGeneratorSchema;

    generate(config: ComparisonGeneratorConfig): ProblemStub<ComparisonProblem> | null {
        validateConfigFields('comparison', config, ['range', 'relation', 'requireNegative', 'requireZero']);
        const resolvedRange = config.range!;
        const minMagnitude = Math.max(1, Math.ceil(resolvedRange.min));
        const maxMagnitude = Math.floor(resolvedRange.max);
        if (resolvedRange.min > resolvedRange.max || maxMagnitude < minMagnitude) return null;

        const requireNegative = config.requireNegative!;
        const requireZero = config.requireZero!;
        const magnitude = Math.floor(random() * (maxMagnitude - minMagnitude + 1)) + minMagnitude;

        let num1 = 0;
        let num2 = 0;

        if (config.relation === Scope.Equal) {
            if (requireZero && requireNegative) return null;
            num1 = requireZero ? 0 : requireNegative ? -magnitude : magnitude;
            num2 = num1;
        } else if (config.relation === Scope.Less) {
            if (requireZero && requireNegative) {
                [num1, num2] = [-magnitude, 0];
            } else if (requireZero) {
                [num1, num2] = [0, magnitude];
            } else if (requireNegative) {
                [num1, num2] = [-magnitude, magnitude];
            } else {
                if (minMagnitude === maxMagnitude) return null;
                [num1, num2] = [minMagnitude, maxMagnitude];
            }
        } else if (config.relation === Scope.Greater) {
            if (requireZero && requireNegative) {
                [num1, num2] = [0, -magnitude];
            } else if (requireZero) {
                [num1, num2] = [magnitude, 0];
            } else if (requireNegative) {
                [num1, num2] = [magnitude, -magnitude];
            } else {
                if (minMagnitude === maxMagnitude) return null;
                [num1, num2] = [maxMagnitude, minMagnitude];
            }
        } else {
            return null;
        }

        let resolvedRelation: 'less' | 'greater' | 'equal';
        if (num1 > num2) {
            resolvedRelation = 'greater';
        } else if (num1 < num2) {
            resolvedRelation = 'less';
        } else {
            resolvedRelation = 'equal';
        }

        return {
            data: {
                num1,
                num2,
                relation: resolvedRelation
            }
        };
    }
}
