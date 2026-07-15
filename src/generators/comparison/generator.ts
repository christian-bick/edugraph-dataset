import { ProblemGenerator, GeneratorInput, ProblemStub, AbstractProblem } from "../../types/ml-engine.ts";
import { ComparisonNumericProblem, ComparisonMatchingProblem } from "../../types/problems.ts";
import { random } from "../../lib/random.ts";
import { Scope } from "edugraph-ts";

export class ComparisonGenerator implements ProblemGenerator<ComparisonNumericProblem | ComparisonMatchingProblem> {
    type: AbstractProblem['type'] = 'comparison';

    generate(input: GeneratorInput): ProblemStub | null {
        const { labels, constraints } = input;
        let mode = constraints.mode || 'numeric';
        if (mode === 'compare-groups') {
            mode = 'matching';
        }
        if (!constraints.mode && labels) {
            if (labels.includes('http://edugraph.io/edu/PhysicalNumbers')) {
                mode = 'matching';
            }
        }

        if (mode === 'matching' || mode === 'count-compare') {
            const comparisonType = constraints.comparisonType || (random() > 0.5 ? 'greater' : 'less');
            const minCount = constraints.minCount !== undefined ? constraints.minCount : 1;
            const maxCount = constraints.maxCount !== undefined ? constraints.maxCount : 10;
            let count1 = Math.floor(random() * (maxCount - minCount + 1)) + minCount;
            let count2 = Math.floor(random() * (maxCount - minCount + 1)) + minCount;

            if (comparisonType === 'greater') {
                while (count1 <= count2) {
                    count1 = Math.floor(random() * (maxCount - minCount + 1)) + minCount;
                    count2 = Math.floor(random() * (maxCount - minCount + 1)) + minCount;
                }
            } else if (comparisonType === 'less') {
                while (count1 >= count2) {
                    count1 = Math.floor(random() * (maxCount - minCount + 1)) + minCount;
                    count2 = Math.floor(random() * (maxCount - minCount + 1)) + minCount;
                }
            } else if (comparisonType === 'equal') {
                count1 = count2;
            }

            const answer = count1 > count2 ? 'A' : (count1 < count2 ? 'B' : 'equal');

            return {
                id: `${mode}-${count1}-${count2}-${comparisonType}`,
                data: {
                    mode,
                    num1: count1,
                    num2: count2,
                    comparisonType,
                    answer
                }
            };
        }

        // Numeric comparison (legacy)
        let digits = constraints.digits;
        if (!digits) {
            if (labels.includes(Scope.NumbersSmaller1000)) digits = 3;
            else if (labels.includes(Scope.NumbersSmaller100)) digits = 2;
            else digits = 1;
        }

        const includesZero = constraints.includesZero !== undefined 
            ? constraints.includesZero 
            : !labels.includes(Scope.NumbersWithoutZero);

        const max = Math.pow(10, digits) - 1;
        let min = digits > 1 ? Math.pow(10, digits - 1) : 0;
        if (!includesZero && digits === 1) {
            min = 1;
        }

        const num1 = Math.floor(random() * (max - min + 1)) + min;
        const num2 = Math.floor(random() * (max - min + 1)) + min;

        if (num1 === num2) {
            return null;
        }

        const answer = num1 > num2 ? '>' : '<';
        const problemKey = `${num1}_${num2}`;
        
        return {
            id: problemKey,
            data: {
                mode: 'numeric',
                num1: num1,
                num2: num2,
                answer: answer
            }
        };
    }
}
