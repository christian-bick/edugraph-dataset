import { ProblemGenerator, GeneratorInput, ProblemStub, AbstractProblem } from "../../types/ml-engine.ts";
import { ArithmeticProblem } from "../../types/problems.ts";
import { random } from "../../lib/random.ts";
import { Area, Scope, Ability } from "edugraph-ts";
import { resolveRangeFromLabels, isSubConceptOf } from "../../lib/ontology.ts";

export class ArithmeticGenerator implements ProblemGenerator<ArithmeticProblem> {
    type: AbstractProblem['type'] = 'arithmetic';

    generate(input: GeneratorInput): ProblemStub | null {
        const { labels, constraints } = input;
        
        const mode = constraints.mode || 'standard';
        // Guard to ensure we only generate supported modes
        if (mode !== 'standard' && mode !== 'representation' && mode !== 'word-problem') {
            return null;
        }
        if (!constraints.mode && labels) {
            if (labels.some(l => isSubConceptOf(l, Ability.ProcedureUnderstanding)) ||
                labels.some(l => isSubConceptOf(l, Scope.NumbersLarger10))) {
                return null;
            }
        }

        const resolvedRange = resolveRangeFromLabels(labels || []);

        let operation: 'addition' | 'subtraction' | 'multiplication' | 'division' = 'addition';
        if (labels.some(l => isSubConceptOf(l, Area.Addition))) operation = 'addition';
        else if (labels.some(l => isSubConceptOf(l, Area.Subtraction))) operation = 'subtraction';
        else if (labels.some(l => isSubConceptOf(l, Area.Multiplication))) operation = 'multiplication';
        else if (labels.some(l => isSubConceptOf(l, Area.Division))) operation = 'division';

        const isPhysical = labels.some(l => isSubConceptOf(l, Scope.PhysicalNumbers)) || mode === 'representation' || mode === 'word-problem';
        if (isPhysical && operation !== 'addition' && operation !== 'subtraction') {
            return null;
        }

        const allowNegatives = labels.some(l => isSubConceptOf(l, Scope.NumbersWithNegatives));
        const includeZero = labels.some(l => isSubConceptOf(l, Scope.NumbersWithZero));
        
        const getRange = (digitConstraint?: number) => {
            if (digitConstraint) {
                return { 
                    min: Math.pow(10, digitConstraint - 1), 
                    max: Math.pow(10, digitConstraint) - 1 
                };
            }
            return { min: resolvedRange.min, max: resolvedRange.max };
        };

        const generateFromRange = (range: {min: number, max: number}, forceZero = false) => {
            if (forceZero) return 0;
            let n = Math.floor(random() * (range.max - range.min + 1)) + range.min;
            if (allowNegatives && random() > 0.5) n = -n;
            if (!includeZero && n === 0) return random() > 0.5 ? 1 : -1;
            return n;
        };

        let num1 = 0;
        let num2 = 0;
        let answer = 0;

        if (operation === 'addition') {
            const maxSum = constraints.maxSum || (isPhysical ? resolvedRange.max : undefined);
            if (maxSum !== undefined) {
                num1 = Math.floor(random() * (maxSum - 1)) + 1;
                num2 = Math.floor(random() * (maxSum - num1)) + 1;
                answer = num1 + num2;
            } else {
                const range1 = getRange(constraints.digitsNum1);
                const range2 = getRange(constraints.digitsNum2);
                num1 = generateFromRange(range1);
                num2 = generateFromRange(range2);
                if (includeZero && num1 !== 0 && num2 !== 0) {
                    if (random() > 0.5) num1 = 0; else num2 = 0;
                }
                answer = num1 + num2;
            }
        } else if (operation === 'subtraction') {
            const maxMinuend = constraints.maxMinuend || (isPhysical ? resolvedRange.max : undefined);
            if (maxMinuend !== undefined) {
                num1 = Math.floor(random() * (maxMinuend - 2)) + 2;
                num2 = Math.floor(random() * (num1 - 1)) + 1;
                answer = num1 - num2;
            } else {
                const range1 = getRange(constraints.digitsNum1);
                const range2 = getRange(constraints.digitsNum2);
                num1 = generateFromRange(range1);
                num2 = generateFromRange(range2);
                if (includeZero && num1 !== 0 && num2 !== 0) {
                    if (random() > 0.5) num1 = 0; else num2 = 0;
                }
                if (!allowNegatives && num1 < num2) [num1, num2] = [num2, num1];
                answer = num1 - num2;
            }
        } else if (operation === 'multiplication') {
            const range1 = getRange(constraints.digitsNum1);
            const range2 = getRange(constraints.digitsNum2);
            num1 = generateFromRange(range1);
            num2 = generateFromRange(range2);
            if (includeZero && num1 !== 0 && num2 !== 0) {
                if (random() > 0.5) num1 = 0; else num2 = 0;
            }
            answer = num1 * num2;
        } else {
            const range1 = getRange(constraints.digitsNum1);
            const range2 = getRange(constraints.digitsNum2);
            num2 = generateFromRange(range2);
            if (num2 === 0) num2 = (random() > 0.5 ? 1 : 2) * (allowNegatives && random() > 0.5 ? -1 : 1);
            answer = generateFromRange(range1);
            num1 = answer * num2;
            if (includeZero && random() > 0.7) { num1 = 0; answer = 0; }
        }

        return {
            id: `${num1}_${operation}_${num2}`,
            data: { num1, num2, answer, operation }
        };
    }
}
