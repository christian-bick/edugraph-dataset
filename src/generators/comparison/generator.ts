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
        validateConfigFields('comparison', config, ['range']);
        const resolvedRange = config.range;

        const min = resolvedRange.min;
        const max = resolvedRange.max;

        const allowNegatives = config.allowNegatives ?? false;
        const includeZero = config.includeZero ?? false;

        const generateNumber = (): number => {
            let n = Math.floor(random() * (max - min + 1)) + min;
            if (allowNegatives && random() > 0.5) {
                n = -n;
            }
            if (!includeZero && n === 0) {
                n = (allowNegatives && random() > 0.5) ? -1 : 1;
            }
            return n;
        };

        const relation = config.relation;
        let comparisonType: 'greater' | 'less' | 'equal' | 'random' = 'random';
        if (relation === Scope.Greater) {
            comparisonType = 'greater';
        } else if (relation === Scope.Less) {
            comparisonType = 'less';
        } else if (relation === Scope.Equal) {
            comparisonType = 'equal';
        }

        if (comparisonType === 'random') {
            const possible: ('greater' | 'less' | 'equal')[] = ['greater', 'less', 'equal'];
            comparisonType = possible[Math.floor(random() * possible.length)];
        }

        let num1 = 0;
        let num2 = 0;

        if (comparisonType === 'equal') {
            num1 = generateNumber();
            num2 = num1;
        } else if (comparisonType === 'greater') {
            let success = false;
            for (let i = 0; i < 100; i++) {
                num1 = generateNumber();
                num2 = generateNumber();
                if (num1 > num2) {
                    success = true;
                    break;
                }
            }
            if (!success) return null;
        } else if (comparisonType === 'less') {
            let success = false;
            for (let i = 0; i < 100; i++) {
                num1 = generateNumber();
                num2 = generateNumber();
                if (num1 < num2) {
                    success = true;
                    break;
                }
            }
            if (!success) return null;
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
            id: `compare-${num1}-${num2}-${resolvedRelation}`,
            data: {
                num1,
                num2,
                relation: resolvedRelation
            }
        };
    }
}
