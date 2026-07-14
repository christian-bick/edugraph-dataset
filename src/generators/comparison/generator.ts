import { ProblemGenerator, GeneratorInput, ProblemStub, AbstractProblem } from "../../types/ml-engine.ts";
import { random } from "../../lib/random.ts";

export class ComparisonGenerator implements ProblemGenerator {
    type: AbstractProblem['type'] = 'comparison';
    compatibleRenderers = ['numbers-compare', 'numbers-compare-groups'];

    generate(input: GeneratorInput): ProblemStub | null {
        const { labels, constraints } = input;
        const mode = constraints.mode || 'numeric';

        if (mode === 'matching' || mode === 'count-compare') {
            const comparisonType = constraints.comparisonType || (random() > 0.5 ? 'greater' : 'less');
            let count1 = Math.floor(random() * 10) + 1;
            let count2 = Math.floor(random() * 10) + 1;

            if (comparisonType === 'greater') {
                while (count1 <= count2) {
                    count1 = Math.floor(random() * 10) + 1;
                    count2 = Math.floor(random() * 10) + 1;
                }
            } else if (comparisonType === 'less') {
                while (count1 >= count2) {
                    count1 = Math.floor(random() * 10) + 1;
                    count2 = Math.floor(random() * 10) + 1;
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
            if (labels.includes('Scope.NumbersSmaller1000')) digits = 3;
            else if (labels.includes('Scope.NumbersSmaller100')) digits = 2;
            else digits = 1;
        }

        const includesZero = constraints.includesZero !== undefined 
            ? constraints.includesZero 
            : !labels.includes('Scope.IntegersWithoutZero');

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
