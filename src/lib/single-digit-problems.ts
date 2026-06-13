import { random } from "./random.ts";
// --- PROBLEM GENERATION ---

const operatorList = ['add', 'subtract', 'multiply', 'divide'];
const operatorSymbols: { [key: string]: string } = {
    add: '+',
    subtract: '−', // Using minus sign, not hyphen
    multiply: '×',
    divide: '÷'
};

export interface Problem {
    num1: number;
    num2: number;
    answer: number;
    symbol?: string;
}

interface ProblemSetConfig {
    operations: string[];
    problemCount: number;
    allowNegatives?: boolean;
    includeTenCarry?: boolean;
    includeZero?: boolean;
}

function getRandomDigit(allowZero: boolean, allowNegative: boolean): number {
    const min = allowZero ? 0 : 1;
    let digit = Math.floor(random() * (10 - min)) + min;
    if (allowNegative && random() < 0.5) {
        digit = -digit;
    }
    return digit;
}

export function generateAddition(includeTenCarry: boolean, includeZero: boolean, allowNegatives: boolean): Problem {
    let num1, num2, answer;
    const maxTries = 100;
    let tries = 0;

    do {
        if (tries++ > maxTries) throw new Error("Could not generate a valid addition problem.");
        num1 = getRandomDigit(includeZero, allowNegatives);
        num2 = getRandomDigit(includeZero, allowNegatives);
        answer = num1 + num2;

        const hasCarry = answer >= 10;
        const hasZero = num1 === 0 || num2 === 0 || answer === 0;

        if (hasCarry === includeTenCarry && hasZero === includeZero) {
            break;
        }
    } while (true);

    return { num1, num2, answer };
}

export function generateSubtraction(includeTenCarry: boolean, includeZero: boolean, allowNegatives: boolean): Problem {
    let num1, num2, answer;
    const maxTries = 100;
    let tries = 0;

    do {
        if (tries++ > maxTries) throw new Error("Could not generate a valid subtraction problem.");
        num1 = getRandomDigit(includeZero, allowNegatives);
        num2 = getRandomDigit(includeZero, allowNegatives);

        // "Carry" in subtraction means borrowing, i.e., num1 < num2
        const hasCarry = num1 < num2;

        if (!allowNegatives && hasCarry) {
            // If negatives are not allowed, we can't have a carry.
            // If the config asks for a carry, it's impossible. We will generate a no-carry instead.
            if (includeTenCarry) {
                [num1, num2] = [num2, num1]; // Swap to ensure no carry
            } else {
                continue; // continue if we are looking for no-carry
            }
        } else if (hasCarry !== includeTenCarry) {
            continue;
        }

        answer = num1 - num2;
        const hasZero = num1 === 0 || num2 === 0 || answer === 0;

        if (hasZero === includeZero) {
            break;
        }

    } while (true);

    return { num1, num2, answer };
}

export function generateMultiplication(includeTenCarry: boolean, includeZero: boolean, allowNegatives: boolean): Problem {
    let num1, num2, answer;
    const maxTries = 100;
    let tries = 0;

    do {
        if (tries++ > maxTries) throw new Error("Could not generate a valid multiplication problem.");
        num1 = getRandomDigit(includeZero, allowNegatives);
        num2 = getRandomDigit(includeZero, allowNegatives);
        answer = num1 * num2;

        const hasCarry = answer >= 10;
        const hasZero = num1 === 0 || num2 === 0 || answer === 0;

        if (hasCarry === includeTenCarry && hasZero === includeZero) {
            break;
        }
    } while (true);

    return { num1, num2, answer };
}

export function generateDivision(includeTenCarry: boolean, allowNegatives: boolean): Problem {
    let num1, num2, answer;
    const maxTries = 100;
    let tries = 0;

    do {
        if (tries++ > maxTries) throw new Error("Could not generate a valid division problem.");
        const divisor = getRandomDigit(false, allowNegatives);
        const quotient = getRandomDigit(false, allowNegatives);
        const dividend = divisor * quotient;

        const hasCarry = dividend >= 10;

        if (hasCarry === includeTenCarry) {
            num1 = dividend;
            num2 = divisor;
            answer = quotient;
            break;
        }
    } while (true);

    return { num1, num2, answer };
}

export function generateProblem(op: string, config: ProblemSetConfig): Problem {
    const { allowNegatives = false, includeTenCarry = false, includeZero = false } = config;
    let problem: Problem;

    switch (op) {
        case 'subtract':
            problem = generateSubtraction(includeTenCarry, includeZero, allowNegatives);
            break;
        case 'multiply':
            problem = generateMultiplication(includeTenCarry, includeZero, allowNegatives);
            break;
        case 'divide':
            problem = generateDivision(includeTenCarry, allowNegatives);
            break;
        case 'add':
        default:
            problem = generateAddition(includeTenCarry, includeZero, allowNegatives);
            break;
    }
    problem.symbol = operatorSymbols[op];
    return problem;
}

export function getNextOperator(operations: string[]): string {
    if (operations.length === 0) {
        return operatorList[Math.floor(random() * operatorList.length)];
    } else if (operations.length === 1) {
        return operations[0];
    } else {
        return operations[Math.floor(random() * operations.length)];
    }
}

export function generateProblemSet(config: ProblemSetConfig): Problem[] {
    const existingProblemKeys = new Set<string>();
    const generatedProblems: Problem[] = [];
    for (let i = 0; i < config.problemCount; i++) {
        const currentOperation = getNextOperator(config.operations);

        let problem: Problem, problemKey: string;
        let tries = 0;
        do {
            if (tries++ > 50) throw new Error(`Failed to generate a unique problem for ${currentOperation}`);
            
            const localConfig = {...config};
            if (config.includeZero) {
                localConfig.includeZero = (i % 2) === 1;
            }

            problem = generateProblem(currentOperation, localConfig);
            problemKey = `${problem.num1},${currentOperation},${problem.num2}`;
        } while (existingProblemKeys.has(problemKey));
        existingProblemKeys.add(problemKey);
        generatedProblems.push(problem);
    }
    return generatedProblems;
}
