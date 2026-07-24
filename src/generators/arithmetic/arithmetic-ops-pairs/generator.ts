import {AbstractProblem, ProblemGenerator, ProblemStub} from "../../../types/ml-engine.ts";
import {ArithmeticProblem} from "../../../types/problems.ts";
import {Area} from "edugraph-ts";
import {random} from "../../../lib/random.ts";
import {ArithmeticOpsPairsGeneratorConfig, ArithmeticOpsPairsGeneratorSchema} from "./spec.ts";
import {validateConfigFields} from "../../../lib/errors.ts";

export class ArithmeticOpsPairsGenerator implements ProblemGenerator<ArithmeticProblem, ArithmeticOpsPairsGeneratorConfig> {
    type: AbstractProblem['type'] = 'arithmetic';
    schema = ArithmeticOpsPairsGeneratorSchema;

    generate(config: ArithmeticOpsPairsGeneratorConfig): ProblemStub | null {
        validateConfigFields('arithmetic-ops-pairs', config, ['range', 'operation']);

        const operation = config.operation;
        const allowNegatives = config.allowNegatives;
        const includeZero = config.includeZero;
        const resolvedRange = config.range!;

        // Fallbacks if schema parsing failed or got unhandled case
        if (!operation) return null;
        
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
            if (allowNegatives) {
                let success = false;
                let attempts = 0;
                const maxVal = resolvedRange.max;
                const minVal = -maxVal;
                
                while (!success && attempts < 100) {
                    attempts++;
                    num1 = generateFromRange();
                    answer = generateFromRange();
                    num2 = answer - num1;
                    
                    if (num2 >= minVal && num2 <= maxVal) {
                        if (includeZero || num2 !== 0) {
                            success = true;
                        }
                    }
                }
                if (!success) return null;
            } else {
                const minVal = includeZero ? 0 : 1;
                const effectiveMax = resolvedRange.max;
                
                num1 = Math.floor(random() * (effectiveMax - minVal * 2 + 1)) + minVal;
                num2 = Math.floor(random() * (effectiveMax - num1 - minVal + 1)) + minVal;
                answer = num1 + num2;
            }
        } else if (operation === Area.Subtraction) {
            if (allowNegatives) {
                let success = false;
                let attempts = 0;
                const maxVal = resolvedRange.max;
                const minVal = -maxVal;
                
                while (!success && attempts < 100) {
                    attempts++;
                    num1 = generateFromRange();
                    num2 = generateFromRange();
                    answer = num1 - num2;
                    
                    if (answer >= minVal && answer <= maxVal) {
                        if (includeZero || answer !== 0) {
                            success = true;
                        }
                    }
                }
                if (!success) return null;
            } else {
                const minVal = includeZero ? 0 : 1;
                const effectiveMax = resolvedRange.max;
                
                num1 = Math.floor(random() * (effectiveMax - minVal * 2 + 1)) + minVal * 2;
                num2 = Math.floor(random() * (num1 - minVal + 1)) + minVal;
                if (num2 > num1 - minVal) num2 = num1 - minVal;
                answer = num1 - num2;
            }
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

        const normalizeZero = (val: number) => val === 0 ? 0 : val;
        num1 = normalizeZero(num1);
        num2 = normalizeZero(num2);
        answer = normalizeZero(answer);

        const blankPart = config.invertProcedure ? 'num2' : 'solution';

        return {
            data: {
                num1,
                num2,
                answer,
                operation: strOp,
                ...(blankPart ? { blankPart } : {})
            }
        };
    }
}
