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

interface SubtractionConfig extends NumberGenerationParams {}

interface DivisionConfig extends NumberGenerationParams {}

interface MultiplicationConfig extends NumberGenerationParams {}

interface AdditionConfig extends NumberGenerationParams {}

interface ProblemSetConfig {
    operations: string[];
    problemCount: number;
    digitsNum1?: number;
    digitsNum2?: number;
    maxDigits?: number;
    allowNegatives?: boolean;
}

interface NumberGenerationParams {
    digitsNum1?: number;
    digitsNum2?: number;
    maxDigits: number;
    allowNegatives: boolean;
}

function generateNumber(digits: number | undefined, maxDigits: number, allowNegatives: boolean): number {
    let exp;
    if (digits) {
        exp = digits;
    } else {
        exp = Math.floor(random() * maxDigits) + 1;
    }

    let minNum = Math.pow(10, exp - 1);
    let maxNum = Math.pow(10, exp) - 1;

    if (allowNegatives) {
        const absMaxNum = Math.pow(10, exp) - 1;
        const absMinNum = Math.pow(10, exp - 1);

        minNum = -absMaxNum;
        maxNum = absMaxNum;
    }

    return Math.floor(random() * (maxNum - minNum + 1)) + minNum;
}

interface MinMaxBounds {
    min: number;
    max: number;
}

function getMinMaxBounds(digits: number | undefined, maxDigits: number, allowNegatives: boolean): MinMaxBounds {
    let exp;
    if (digits) {
        exp = digits;
    } else {
        exp = Math.floor(random() * maxDigits) + 1;
    }

    let minNum = Math.pow(10, exp - 1);
    let maxNum = Math.pow(10, exp) - 1;

    if (allowNegatives) {
        const absMaxNum = Math.pow(10, exp) - 1;
        const absMinNum = Math.pow(10, exp - 1);

        minNum = -absMaxNum;
        maxNum = absMaxNum;
    }
    return { min: minNum, max: maxNum };
}

export function generateSubtraction(params: SubtractionConfig): Problem {
    const { digitsNum1, digitsNum2, maxDigits, allowNegatives } = params;

    const num1 = generateNumber(digitsNum1, maxDigits, allowNegatives);

    let num2;
    if (allowNegatives) {
        num2 = generateNumber(digitsNum2, maxDigits, allowNegatives);
    } else {
        // For subtraction, num2 must be less than or equal to num1 to avoid negative answers
        // unless allowNegatives is true.
        // We need to generate num2 within the correct digit range, but also ensure num2 <= num1.
        // This requires a custom generation for num2 that respects both digit constraints and the value constraint.

        // Recalculate minNum2 and maxNum2 based on digitsNum2
        let exp2;
        if (digitsNum2) {
            exp2 = digitsNum2;
        } else {
            exp2 = Math.floor(random() * maxDigits) + 1;
        }
        let minNum2ForSubtraction = Math.pow(10, exp2 - 1);
        let maxNum2ForSubtraction = Math.pow(10, exp2) - 1;

        // Cap maxNum2ForSubtraction by num1
        maxNum2ForSubtraction = Math.min(maxNum2ForSubtraction, num1);

        // Ensure minNum2ForSubtraction is not greater than maxNum2ForSubtraction
        if (minNum2ForSubtraction > maxNum2ForSubtraction) {
            num2 = num1; // Fallback to ensure a valid problem (answer 0)
        } else {
            num2 = Math.floor(random() * (maxNum2ForSubtraction - minNum2ForSubtraction + 1)) + minNum2ForSubtraction;
        }
    }
    const answer = num1 - num2;
    return {num1, num2, answer}
}

export function generateDivision(params: DivisionConfig): Problem {
    const { digitsNum1, digitsNum2, maxDigits, allowNegatives } = params;

    let divisor, quotient;
    let tries = 0;
    const maxTries = 50;

    // Get bounds for num1 (dividend)
    const { min: minNum1, max: maxNum1 } = getMinMaxBounds(digitsNum1, maxDigits, allowNegatives);

    // Get bounds for num2 (divisor)
    const { min: minNum2, max: maxNum2 } = getMinMaxBounds(digitsNum2, maxDigits, allowNegatives);

    // Apply division-specific constraints for num2 (divisor)
    let divMaxNum2 = Math.min(maxNum2, Math.max(Math.pow(10, digitsNum1 ? digitsNum1 - 1 : 1), 5)); // Use digitsNum1 for exp1
    let divMinNum2 = Math.min(minNum2, Math.max(Math.pow(10, digitsNum1 ? digitsNum1 - 2 : 0), 1)); // Use digitsNum1 for exp1
    if (allowNegatives) {
        divMinNum2 = -divMaxNum2;
    }

    while (tries < maxTries) {
        tries++;

        divisor = Math.floor(random() * (divMaxNum2 - divMinNum2 + 1)) + divMinNum2;
        if (divisor === 0) continue;

        let currentMaxQuotient, currentMinQuotient;

        if (divisor > 0) {
            currentMaxQuotient = Math.floor(maxNum1 / divisor);
            currentMinQuotient = Math.ceil(minNum1 / divisor);
        }
        else { // divisor < 0
            currentMaxQuotient = Math.floor(minNum1 / divisor);
            currentMinQuotient = Math.ceil(maxNum1 / divisor);
        }

        if (currentMaxQuotient < currentMinQuotient) continue;

        quotient = Math.floor(random() * (currentMaxQuotient - currentMinQuotient + 1)) + currentMinQuotient;

        if (divisor > -2 && divisor < 2) continue;
        if (quotient > -2 && quotient < 2) continue;
        break;

    }
    if (tries >= maxTries) {
        throw new Error("Could not generate a valid division problem with the given constraints.");
    }

    return {
        num1: quotient * divisor,
        num2: divisor,
        answer: quotient,
    }
}


export function generateMultiplication(params: MultiplicationConfig): Problem {
    const { digitsNum1, digitsNum2, maxDigits, allowNegatives } = params;

    const factor1 = generateNumber(digitsNum1, maxDigits, allowNegatives);
    const factor2 = generateNumber(digitsNum2, maxDigits, allowNegatives);

    return {
        num1: factor1,
        num2: factor2,
        answer: factor1 * factor2,
    }
}

export function generateAddition(params: AdditionConfig): Problem {
    const { digitsNum1, digitsNum2, maxDigits, allowNegatives } = params;

    const num1 = generateNumber(digitsNum1, maxDigits, allowNegatives);
    const num2 = generateNumber(digitsNum2, maxDigits, allowNegatives);

    return {
        num1,
        num2,
        answer: num1 + num2
    }
}

export function generateProblem(op: string, config: ProblemSetConfig): Problem {

    const { digitsNum1, digitsNum2, maxDigits = 5, allowNegatives = false } = config;

    const numberGenParams = {
        digitsNum1,
        digitsNum2,
        maxDigits,
        allowNegatives,
    };
    let problem: Problem = {} as Problem;

    switch (op) {
        case 'subtract':
            problem = generateSubtraction(numberGenParams)
            break;

        case 'multiply':
            problem = generateMultiplication(numberGenParams)
            break;

        case 'divide':
            problem = generateDivision(numberGenParams)
            break;

        case 'add':
        default:
            problem = generateAddition(numberGenParams)
            break;
    }
    problem.symbol = operatorSymbols[op];
    return problem;
}

export function getNextOperator(operations: string[]): string {
    if (operations.length === 0) {
        return operatorList[Math.floor(random() * operatorList.length)]
    } else if (operations.length === 1) {
        return operations[0]
    } else {
        return operations[Math.floor(random() * operations.length)]
    }
}

export function generateProblemSet(config: ProblemSetConfig): Problem[] {
    const existingProblemKeys = new Set<string>();
    const generatedProblems: Problem[] = []
    for (let i = 0; i < config.problemCount; i++) {
        // If in mixed mode, pick a random operator for each problem
        const currentOperation = getNextOperator(config.operations);

        let problem: Problem, problemKey: string;
        do {
            problem = generateProblem(currentOperation, config);
            // Make the key unique for mixed mode (e.g., "10-5" is different from "10+5")
            problemKey = `${problem.num1},${currentOperation},${problem.num2}`;
        } while (existingProblemKeys.has(problemKey));
        existingProblemKeys.add(problemKey);
        generatedProblems.push(problem)
    }
    return generatedProblems
}