import { random } from "./random.ts";
export interface Problem {
    num1: number;
    num2: number;
    answer: '>' | '<';
}

export function generateProblemSet(config: { digits: number, problemCount: number, includesZero: boolean }): Problem[] {
    const problemSet: Problem[] = [];
    const problemKeys = new Set<string>();

    const max = Math.pow(10, config.digits) - 1;
    let min = config.digits > 1 ? Math.pow(10, config.digits - 1) : 0;
    if (!config.includesZero && config.digits === 1) {
        min = 1;
    }


    // Generate two unique examples
    while (problemSet.length < 2) {
        const num1 = Math.floor(random() * (max - min + 1)) + min;
        const num2 = Math.floor(random() * (max - min + 1)) + min;

        if (num1 === num2) {
            continue;
        }

        const problemKey = `${num1},${num2}`;
        if (!problemKeys.has(problemKey)) {
            problemKeys.add(problemKey);
            problemSet.push({
                num1,
                num2,
                answer: num1 > num2 ? '>' : '<'
            });
        }
    }
    // Make sure the first two examples cover both cases
    if (problemSet[0].answer === problemSet[1].answer) {
        const temp = problemSet[1].num1;
        problemSet[1].num1 = problemSet[1].num2;
        problemSet[1].num2 = temp;
        problemSet[1].answer = problemSet[1].num1 > problemSet[1].num2 ? '>' : '<';
    }


    while (problemSet.length < config.problemCount) {
        const num1 = Math.floor(random() * (max - min + 1)) + min;
        const num2 = Math.floor(random() * (max - min + 1)) + min;

        if (num1 === num2) {
            continue;
        }

        const problemKey = `${num1},${num2}`;
        if (!problemKeys.has(problemKey)) {
            problemKeys.add(problemKey);
            problemSet.push({
                num1,
                num2,
                answer: num1 > num2 ? '>' : '<'
            });
        }
    }

    return problemSet;
}
