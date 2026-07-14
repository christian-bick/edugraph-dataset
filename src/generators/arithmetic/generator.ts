import { ProblemGenerator, GeneratorInput, ProblemStub, AbstractProblem } from "../../types/ml-engine.ts";
import { random } from "../../lib/random.ts";
import { Area, Scope } from "edugraph-ts";

export class ArithmeticGenerator implements ProblemGenerator {
    type: AbstractProblem['type'] = 'arithmetic';
    compatibleRenderers = ['operations-boxes', 'operations-vertical', 'operations-representation', 'operations-decompose', 'place-value-blocks'];

    generate(input: GeneratorInput): ProblemStub | null {
        const { labels, constraints } = input;
        const mode = constraints.mode || 'standard';

        if (mode === 'representation' || mode === 'word-problem') {
            const operation = constraints.operation || (random() > 0.5 ? 'addition' : 'subtraction');
            let num1 = 0;
            let num2 = 0;
            let answer = 0;

            if (operation === 'addition') {
                const maxSum = constraints.maxSum || 10;
                num1 = Math.floor(random() * (maxSum - 1)) + 1; // 1 to maxSum-1
                num2 = Math.floor(random() * (maxSum - num1)) + 1; // 1 to maxSum-num1
                answer = num1 + num2;
            } else {
                const maxMinuend = constraints.maxMinuend || 10;
                num1 = Math.floor(random() * (maxMinuend - 2)) + 2; // 2 to maxMinuend
                num2 = Math.floor(random() * (num1 - 1)) + 1; // 1 to num1-1
                answer = num1 - num2;
            }

            let textScenario = '';
            if (mode === 'word-problem') {
                const addTemplates = [
                    `Maya has ${num1} stickers. She gets ${num2} more. How many stickers does she have now?`,
                    `There are ${num1} red birds and ${num2} blue birds on a tree. How many birds are there in total?`
                ];
                const subTemplates = [
                    `There were ${num1} apples on a table. Liam ate ${num2} of them. How many apples are left?`,
                    `There are ${num1} balloons. ${num2} balloons pop. How many balloons are left?`
                ];
                const templates = operation === 'addition' ? addTemplates : subTemplates;
                textScenario = templates[Math.floor(random() * templates.length)];
            }

            return {
                id: `${mode}-${operation}-${num1}-${num2}`,
                data: {
                    mode,
                    operation,
                    num1,
                    num2,
                    answer,
                    textScenario
                }
            };
        }

        if (mode === 'decompose') {
            const targetNumber = constraints.targetNumber || Math.floor(random() * (10 - 3 + 1)) + 3; // 3 to 10
            
            // Find all unique pairs (a, b) such that a + b = targetNumber and a >= b
            const pairs: [number, number][] = [];
            for (let i = 1; i <= Math.floor(targetNumber / 2); i++) {
                pairs.push([i, targetNumber - i]);
            }

            if (pairs.length < 1) {
                return null;
            }

            // We need 2 distinct pairs if possible.
            // If only 1 pair exists (e.g. target is 3: only [1, 2]), we can use [1, 2] and [2, 1] as different orders.
            let pair1: [number, number] = [0, 0];
            let pair2: [number, number] = [0, 0];

            if (pairs.length >= 2) {
                const idx1 = Math.floor(random() * pairs.length);
                let idx2 = Math.floor(random() * pairs.length);
                while (idx1 === idx2) {
                    idx2 = Math.floor(random() * pairs.length);
                }
                pair1 = pairs[idx1];
                pair2 = pairs[idx2];
                // Randomly shuffle order of pairs
                if (random() > 0.5) pair1 = [pair1[1], pair1[0]];
                if (random() > 0.5) pair2 = [pair2[1], pair2[0]];
            } else {
                pair1 = pairs[0];
                pair2 = [pairs[0][1], pairs[0][0]];
            }

            return {
                id: `decompose-${targetNumber}-${pair1[0]}-${pair2[0]}`,
                data: {
                    mode,
                    targetNumber,
                    pair1,
                    pair2
                }
            };
        }

        if (mode === 'make-ten') {
            const givenNumber = constraints.givenNumber || Math.floor(random() * 9) + 1; // 1 to 9
            const missingNumber = 10 - givenNumber;
            return {
                id: `make-ten-${givenNumber}`,
                data: {
                    mode,
                    givenNumber,
                    missingNumber,
                    target: 10
                }
            };
        }

        if (mode === 'compose-teen' || mode === 'decompose-teen') {
            const ones = constraints.ones || Math.floor(random() * 9) + 1; // 1 to 9
            const target = 10 + ones;
            return {
                id: `${mode}-${target}`,
                data: {
                    mode,
                    ones,
                    target
                }
            };
        }

        // Standard arithmetic (legacy)
        let operator: 'add' | 'subtract' | 'multiply' | 'divide' = 'add';
        if (labels.includes(Area.Addition)) operator = 'add';
        else if (labels.includes(Area.Subtraction)) operator = 'subtract';
        else if (labels.includes(Area.Multiplication)) operator = 'multiply';
        else if (labels.includes(Area.Division)) operator = 'divide';

        const allowNegatives = labels.includes(Scope.IntegersWithNegatives);
        const includeZero = labels.includes(Scope.IntegersWithZero);
        
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
            return { min: 0, max: 9 };
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
        if (operator === 'add') {
            answer = num1 + num2;
        } else if (operator === 'subtract') {
            if (!allowNegatives && num1 < num2) [num1, num2] = [num2, num1];
            answer = num1 - num2;
        } else if (operator === 'multiply') {
            answer = num1 * num2;
        } else {
            if (num2 === 0) num2 = (random() > 0.5 ? 1 : 2) * (allowNegatives && random() > 0.5 ? -1 : 1);
            answer = generateFromRange(range1);
            num1 = answer * num2;
            if (includeZero && random() > 0.7) { num1 = 0; answer = 0; }
        }

        return {
            id: `${num1}_${operator}_${num2}`,
            data: { num1, num2, answer, operator, mode: 'standard' }
        };
    }
}
