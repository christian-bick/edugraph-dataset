import {AbstractProblem, GeneratorInput, ProblemGenerator, ProblemStub} from "../../types/ml-engine.ts";
import {ArithmeticProblem} from "../../types/problems.ts";
import {random} from "../../lib/random.ts";
import {extractConfig} from "../../lib/utils.ts";
import {ArithmeticGeneratorSchema} from "./spec.ts";
import {Area} from "edugraph-ts";

export class ArithmeticGenerator implements ProblemGenerator<ArithmeticProblem> {
    type: AbstractProblem['type'] = 'arithmetic';

    generate(input: GeneratorInput): ProblemStub | null {
        const { labels } = input;
        
        const { config } = extractConfig(ArithmeticGeneratorSchema, labels || []);

        const operation = config.operation;
        const allowNegatives = config.allowNegatives;
        const includeZero = config.includeZero;
        const resolvedRange = config.range;

        // Fallbacks if schema parsing failed or got unhandled case
        if (!operation || !resolvedRange) return null;
        
        const generateFromRange = (forceZero = false) => {
            if (forceZero) return 0;
            let n = Math.floor(random() * (resolvedRange.max - resolvedRange.min + 1)) + resolvedRange.min;
            if (allowNegatives && random() > 0.5) n = -n;
            if (!includeZero && n === 0) return random() > 0.5 ? 1 : -1;
            return n;
        };

        let num1 = 0;
        let num2 = 0;
        let answer = 0;

        if (operation === Area.Addition) {
            const minVal = includeZero ? 0 : 1;
            const effectiveMax = resolvedRange.max;
            
            num1 = Math.floor(random() * (effectiveMax - minVal * 2 + 1)) + minVal;
            num2 = Math.floor(random() * (effectiveMax - num1 - minVal + 1)) + minVal;
            answer = num1 + num2;
        } else if (operation === Area.Subtraction) {
            const minVal = includeZero ? 0 : 1;
            const effectiveMax = resolvedRange.max;
            
            num1 = Math.floor(random() * (effectiveMax - minVal * 2 + 1)) + minVal * 2;
            num2 = Math.floor(random() * (num1 - minVal + 1)) + minVal;
            if (num2 > num1 - minVal) num2 = num1 - minVal;
            answer = num1 - num2;
        } else if (operation === Area.Multiplication) {
            num1 = generateFromRange();
            num2 = generateFromRange();
            if (includeZero && num1 !== 0 && num2 !== 0) {
                if (random() > 0.5) num1 = 0; else num2 = 0;
            }
            answer = num1 * num2;
        } else {
            num2 = generateFromRange();
            if (num2 === 0) num2 = (random() > 0.5 ? 1 : 2) * (allowNegatives && random() > 0.5 ? -1 : 1);
            answer = generateFromRange();
            num1 = answer * num2;
            if (includeZero && random() > 0.7) { num1 = 0; answer = 0; }
        }

        const opMap: Record<string, string> = {
            [Area.Addition]: 'addition',
            [Area.Subtraction]: 'subtraction',
            [Area.Multiplication]: 'multiplication',
            [Area.Division]: 'division'
        };

        const strOp = opMap[operation];

        return {
            id: `${num1}_${strOp}_${num2}`,
            data: { num1, num2, answer, operation: strOp }
        };
    }
}
