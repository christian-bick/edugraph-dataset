import {AbstractProblem, GeneratorInput, ProblemGenerator, ProblemStub} from "../../types/ml-engine.ts";
import {ArithmeticProblem} from "../../types/problems.ts";
import {random} from "../../lib/random.ts";
import {Area, Scope} from "edugraph-ts";
import {isSubConceptOf, resolveRangeFromLabels} from "../../lib/ontology.ts";

export class ArithmeticGenerator implements ProblemGenerator<ArithmeticProblem> {
    type: AbstractProblem['type'] = 'arithmetic';

    generate(input: GeneratorInput): ProblemStub | null {
        const { labels, constraints } = input;
        
        const resolvedRange = resolveRangeFromLabels(labels || []);

        let operation: 'addition' | 'subtraction' | 'multiplication' | 'division' = 'addition';
        if (labels.some(l => isSubConceptOf(l, Area.Addition))) operation = 'addition';
        else if (labels.some(l => isSubConceptOf(l, Area.Subtraction))) operation = 'subtraction';
        else if (labels.some(l => isSubConceptOf(l, Area.Multiplication))) operation = 'multiplication';
        else if (labels.some(l => isSubConceptOf(l, Area.Division))) operation = 'division';



        const allowNegatives = labels.some(l => isSubConceptOf(l, Scope.NumbersWithNegatives));
        const includeZero = labels.some(l => isSubConceptOf(l, Scope.NumbersWithZero));
        
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

        if (operation === 'addition') {
            const minVal = includeZero ? 0 : 1;
            const effectiveMax = resolvedRange.max;
            
            num1 = Math.floor(random() * (effectiveMax - minVal * 2 + 1)) + minVal;
            num2 = Math.floor(random() * (effectiveMax - num1 - minVal + 1)) + minVal;
            answer = num1 + num2;
        } else if (operation === 'subtraction') {
            const minVal = includeZero ? 0 : 1;
            const effectiveMax = resolvedRange.max;
            
            num1 = Math.floor(random() * (effectiveMax - minVal * 2 + 1)) + minVal * 2;
            num2 = Math.floor(random() * (num1 - minVal + 1)) + minVal;
            if (num2 > num1 - minVal) num2 = num1 - minVal;
            answer = num1 - num2;
        } else if (operation === 'multiplication') {
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

        return {
            id: `${num1}_${operation}_${num2}`,
            data: { num1, num2, answer, operation }
        };
    }
}
