import { ProblemGenerator, GeneratorInput, ProblemStub, AbstractProblem } from "../../types/ml-engine.ts";
import { ArithmeticStandardProblem } from "../../types/problems.ts";
import { random } from "../../lib/random.ts";
import { Area, Scope, Ability } from "edugraph-ts";
import { resolveRangeFromLabels, isSubConceptOf } from "../../lib/ontology.ts";

export class ArithmeticGenerator implements ProblemGenerator<ArithmeticStandardProblem> {
    type: AbstractProblem['type'] = 'arithmetic';

    generate(input: GeneratorInput): ProblemStub | null {
        const { labels, constraints } = input;
        
        // Guard to ensure we only generate standard arithmetic problems
        if (constraints.mode && constraints.mode !== 'standard') {
            return null;
        }
        if (!constraints.mode && labels) {
            if (labels.some(l => isSubConceptOf(l, Ability.ProcedureUnderstanding)) ||
                (labels.some(l => isSubConceptOf(l, Scope.PhysicalNumbers)) && labels.some(l => isSubConceptOf(l, Ability.ProcedureExecution))) ||
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

        if (includeZero && num1 !== 0 && num2 !== 0) {
            if (random() > 0.5) num1 = 0; else num2 = 0;
        }

        let answer;
        if (operation === 'addition') {
            answer = num1 + num2;
        } else if (operation === 'subtraction') {
            if (!allowNegatives && num1 < num2) [num1, num2] = [num2, num1];
            answer = num1 - num2;
        } else if (operation === 'multiplication') {
            answer = num1 * num2;
        } else {
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
