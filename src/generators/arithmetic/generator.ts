import { ProblemGenerator, GeneratorInput, ProblemStub, AbstractProblem } from "../../types/ml-engine.ts";
import { random } from "../../lib/random.ts";
import { Area, Scope, Ability } from "edugraph-ts";

export class ArithmeticGenerator implements ProblemGenerator {
    type: AbstractProblem['type'] = 'arithmetic';
    compatibleRenderers = ['operations-boxes', 'operations-vertical'];

    generate(input: GeneratorInput): ProblemStub | null {
        const { labels, constraints } = input;

        // 1. Determine Operator
        let operator: 'add' | 'subtract' | 'multiply' | 'divide' = 'add';
        if (labels.includes(Area.IntegerAddition)) operator = 'add';
        else if (labels.includes(Area.IntegerSubtraction)) operator = 'subtract';
        else if (labels.includes(Area.IntegerMultiplication)) operator = 'multiply';
        else if (labels.includes(Area.IntegerDivision)) operator = 'divide';

        // 2. Determine Bounds
        const allowNegatives = labels.includes(Scope.NumbersWithNegatives);
        const includeZero = labels.includes(Scope.NumbersWithZero);
        
        const getRange = (digitConstraint?: number) => {
            if (digitConstraint) {
                return { 
                    min: Math.pow(10, digitConstraint - 1), 
                    max: Math.pow(10, digitConstraint) - 1 
                };
            }
            if (labels.includes(Scope.NumbersSmaller10)) return { min: 0, max: 9 };
            if (labels.includes(Scope.NumbersSmaller100)) return { min: 0, max: 99 };
            if (labels.includes(Scope.NumbersSmaller1000)) return { min: 0, max: 999 };
            return { min: 0, max: 9 }; // Default
        };

        const range1 = getRange(constraints.digitsNum1);
        const range2 = getRange(constraints.digitsNum2);

        const generateFromRange = (range: {min: number, max: number}, forceZero = false) => {
            if (forceZero) return 0;
            let n = Math.floor(random() * (range.max - range.min + 1)) + range.min;
            if (allowNegatives && random() > 0.5) n = -n;
            if (!includeZero && n === 0) return random() > 0.5 ? 1 : -1;
            return n;
        };

        let num1 = generateFromRange(range1);
        let num2 = generateFromRange(range2);

        // 3. Enforce Zero if requested
        if (includeZero && num1 !== 0 && num2 !== 0) {
            if (random() > 0.5) num1 = 0; else num2 = 0;
        }

        // 4. Calculate Answer and Adjust
        let answer;
        if (operator === 'add') {
            answer = num1 + num2;
        } else if (operator === 'subtract') {
            if (!allowNegatives && num1 < num2) [num1, num2] = [num2, num1];
            answer = num1 - num2;
        } else if (operator === 'multiply') {
            answer = num1 * num2;
        } else { // divide
            if (num2 === 0) num2 = (random() > 0.5 ? 1 : 2) * (allowNegatives && random() > 0.5 ? -1 : 1);
            answer = generateFromRange(range1); // Reuse range1 for quotient scale
            num1 = answer * num2;
            if (includeZero && random() > 0.7) { num1 = 0; answer = 0; }
        }

        return {
            id: `${num1}_${operator}_${num2}`,
            data: { num1, num2, answer, operator }
        };
    }
}
