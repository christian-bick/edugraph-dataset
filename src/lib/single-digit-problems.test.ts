import * as randomModule from "./random.ts";
import {
    generateAddition,
    generateSubtraction,
    generateMultiplication,
    generateDivision,
    generateProblemSet
} from './single-digit-problems.ts';
import {describe, it, expect, vi, afterEach} from 'vitest';

afterEach(() => {
    vi.restoreAllMocks();
});

describe('generateAddition', () => {
    it('should generate a problem with carry and no zero', () => {
        for (let i = 0; i < 100; i++) {
            const {num1, num2, answer} = generateAddition(true, false, false);
            expect(answer).toBeGreaterThanOrEqual(10);
            expect(num1).not.toBe(0);
            expect(num2).not.toBe(0);
            expect(answer).not.toBe(0);
        }
    });

    it('should generate a problem with no carry and no zero', () => {
        for (let i = 0; i < 100; i++) {
            const {num1, num2, answer} = generateAddition(false, false, false);
            expect(answer).toBeLessThan(10);
            expect(num1).not.toBe(0);
            expect(num2).not.toBe(0);
        }
    });

    it('should generate a problem with no carry and with zero', () => {
        for (let i = 0; i < 100; i++) {
            const {num1, num2, answer} = generateAddition(false, true, false);
            expect(answer).toBeLessThan(10);
            expect(num1 === 0 || num2 === 0 || answer === 0).toBe(true);
        }
    });

    it('should generate a problem with negative numbers', () => {
        vi.spyOn(randomModule, "random")
            .mockReturnValueOnce(0.1) // digit for num1 = 1
            .mockReturnValueOnce(0.4) // sign for num1 = negative
            .mockReturnValueOnce(0.2) // digit for num2 = 2
            .mockReturnValueOnce(0.6); // sign for num2 = positive

        const {num1, num2, answer} = generateAddition(false, false, true);
        expect(num1).toBe(-1);
        expect(num2).toBe(2);
        expect(answer).toBe(1);
    });
});

describe('generateSubtraction', () => {
    it('should generate a problem with borrow (carry) and no zero', () => {
        for (let i = 0; i < 100; i++) {
            const {num1, num2} = generateSubtraction(true, false, true);
            expect(num1).toBeLessThan(num2);
            expect(num1).not.toBe(0);
            expect(num2).not.toBe(0);
        }
    });

    it('should generate a problem with no borrow (carry) and no zero', () => {
        for (let i = 0; i < 100; i++) {
            const {num1, num2} = generateSubtraction(false, false, false);
            expect(num1).toBeGreaterThanOrEqual(num2);
            expect(num1).not.toBe(0);
            expect(num2).not.toBe(0);
        }
    });

    it('should generate a problem with no borrow (carry) and with zero', () => {
        for (let i = 0; i < 100; i++) {
            const {num1, num2, answer} = generateSubtraction(false, true, false);
            expect(num1).toBeGreaterThanOrEqual(num2);
            expect(num1 === 0 || num2 === 0 || answer === 0).toBe(true);
        }
    });

    it('should generate a problem with negative numbers', () => {
        vi.spyOn(randomModule, "random")
            .mockReturnValueOnce(0.8) // digit for num1 = 8
            .mockReturnValueOnce(0.6) // sign for num1 = positive
            .mockReturnValueOnce(0.1) // digit for num2 = 1
            .mockReturnValueOnce(0.4); // sign for num2 = negative

        const {num1, num2, answer} = generateSubtraction(false, false, true);
        expect(num1).toBe(8);
        expect(num2).toBe(-1);
        expect(answer).toBe(9);
    });
});

describe('generateMultiplication', () => {
    it('should generate a problem with negative numbers', () => {
        vi.spyOn(randomModule, "random")
            .mockReturnValueOnce(0.4) // digit for num1 = 4
            .mockReturnValueOnce(0.4) // sign for num1 = negative
            .mockReturnValueOnce(0.6) // digit for num2 = 6
            .mockReturnValueOnce(0.6); // sign for num2 = positive

        const {num1, num2, answer} = generateMultiplication(false, false, true);
        expect(num1).toBe(-4);
        expect(num2).toBe(6);
        expect(answer).toBe(-24);
    });
});

describe('generateDivision', () => {
    it('should generate a problem with negative numbers', () => {
        vi.spyOn(randomModule, "random")
            .mockReturnValueOnce(0.8) // digit for divisor = 8
            .mockReturnValueOnce(0.4) // sign for divisor = negative
            .mockReturnValueOnce(0.2) // digit for quotient = 2
            .mockReturnValueOnce(0.6); // sign for quotient = positive

        const {num1, num2, answer} = generateDivision(false, true);
        expect(num2).toBe(-8); // divisor
        expect(answer).toBe(2); // quotient
        expect(num1).toBe(-16); // dividend
    });
});

describe('generateProblemSet', () => {
    it('should alternate problems with and without zero when includeZero is true', () => {
        const config = {
            operations: ['add'],
            problemCount: 10,
            includeZero: true,
            includeTenCarry: false
        };
        const problemSet = generateProblemSet(config);

        problemSet.forEach((problem, index) => {
            const hasZero = problem.num1 === 0 || problem.num2 === 0 || problem.answer === 0;
            if ((index % 2) === 1) {
                expect(hasZero).toBe(true);
            } else {
                expect(hasZero).toBe(false);
            }
        });
    });

    it('should not include zero when includeZero is false', () => {
        const config = {
            operations: ['add'],
            problemCount: 10,
            includeZero: false,
            includeTenCarry: false
        };
        const problemSet = generateProblemSet(config);

        problemSet.forEach(problem => {
            const hasZero = problem.num1 === 0 || problem.num2 === 0 || problem.answer === 0;
            expect(hasZero).toBe(false);
        });
    });
});