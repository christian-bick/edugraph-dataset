import * as randomModule from "./random.ts";
import {
    generateSubtraction,
    generateAddition,
    generateDivision,
    generateMultiplication
} from './arithmetic-problems.ts';
import {describe, it, expect, vi, afterEach} from 'vitest';

afterEach(() => {
    vi.restoreAllMocks();
});

describe('generateSubtraction', () => {

    // --- Standard Cases ---
    describe('Standard Operation', () => {
        it('should correctly subtract single-digit numbers', () => {
            vi.spyOn(randomModule, "random").mockReturnValueOnce(4 / 9).mockReturnValueOnce(0.2);
            const config = {digitsNum1: 1, digitsNum2: 1, maxDigits: 5, allowNegatives: false};
            const {num1, num2, answer} = generateSubtraction(config);
            expect(num1).toBe(5);
            expect(num2).toBe(2);
            expect(answer).toBe(3);
        });

        it('should correctly subtract two-digit numbers', () => {
            vi.spyOn(randomModule, "random").mockReturnValueOnce(4 / 9).mockReturnValueOnce(15 / 41);
            const config = {digitsNum1: 2, digitsNum2: 2, maxDigits: 5, allowNegatives: false};
            const {num1, num2, answer} = generateSubtraction(config);
            expect(num1).toBe(50);
            expect(num2).toBe(25);
            expect(answer).toBe(25);
        });

        it('should correctly subtract a 3-digit number from a 4-digit number', () => {
            vi.spyOn(randomModule, "random").mockReturnValueOnce(234 / 9000).mockReturnValueOnce(467.000000000001 / 900);
            const config = {digitsNum1: 4, digitsNum2: 3, maxDigits: 5, allowNegatives: false};
            const {num1, num2, answer} = generateSubtraction(config);
            expect(num1).toBe(1234);
            expect(num2).toBe(567);
            expect(answer).toBe(667);
        });

        it('should ensure the answer is always non-negative by capping num2', () => {
            // Force num1 to be a specific value, then try to generate the highest possible num2.
            vi.spyOn(randomModule, "random")
                .mockReturnValueOnce(0.2) // Generates num1: floor(0.2 * (10-5+1)) + 5 = 6
                .mockReturnValueOnce(0.999); // Tries to generate the highest possible num2

            const config = {digitsNum1: 1, digitsNum2: 1, maxDigits: 5, allowNegatives: false};
            const {num1, num2, answer} = generateSubtraction(config);

            // With num1=6, maxSubtracted is min(6, 15) = 6.
            // num2's max is floor(0.999 * (6-1+1)) + 1 = 6.
            expect(num1).toBe(2);
            expect(num2).toBe(2);
            expect(num2).toBeLessThanOrEqual(num1);
            expect(answer).toBe(0);
            expect(answer).toBeGreaterThanOrEqual(0);
        });
    });

    describe('when allowNegatives is true', () => {
        it('should produce a negative answer when subtracting a larger positive number', () => {
            vi.spyOn(randomModule, "random").mockReturnValueOnce(0).mockReturnValueOnce(0.999999); // Selects minimums
            const config = {digitsNum1: 2, digitsNum2: 2, maxDigits: 5, allowNegatives: true};
            const {num1, num2, answer} = generateSubtraction(config);

            expect(num1).toBe(-99);
            expect(num2).toBe(99);
            expect(answer).toBe(-198);
        });

        it('should correctly subtract a negative number from a positive number (e.g., 10 - (-5))', () => {
            vi.spyOn(randomModule, "random").mockReturnValueOnce(0.999999).mockReturnValueOnce(0); // Selects minimums
            const config = {digitsNum1: 2, digitsNum2: 1, maxDigits: 5, allowNegatives: true};
            const {num1, num2, answer} = generateSubtraction(config);

            expect(num1).toBe(99);
            expect(num2).toBe(-9);
            expect(answer).toBe(108);
        });
    });

    // --- Boundary Cases ---
    describe('Boundary Conditions', () => {
        it('should use 1 for random 0 minimum number', () => {
            // Force num1 to be 0
            vi.spyOn(randomModule, "random").mockReturnValue(0);
            const config = {digitsNum1: 1, digitsNum2: 1, maxDigits: 5, allowNegatives: false};
            const {num1, num2, answer} = generateSubtraction(config);

            // maxSubtracted = min(0, 5) = 0.
            // num2 = floor(random * (0-0+1)) + 0 = 0.
            expect(num1).toBe(1);
            expect(num2).toBe(1);
            expect(answer).toBe(0);
        });

        it('should generate the minimum possible numbers when randomModule.random returns 0', () => {
            // Mock randomModule.random to always return 0, which will select the minimum values.
            vi.spyOn(randomModule, "random").mockReturnValue(0);

            const config = {digitsNum1: 2, digitsNum2: 1, maxDigits: 5, allowNegatives: false};
            const {num1, num2, answer} = generateSubtraction(config);

            // num1 should be its minimum: floor(0 * (20-10+1)) + 10 = 10
            expect(num1).toBe(10);

            // maxSubtracted becomes min(10, 9) = 9
            // num2 should be its minimum: floor(0 * (9-1+1)) + 1 = 1
            expect(num2).toBe(1);

            expect(answer).toBe(9);
        });

        it('should generate the maximum possible numbers when randomModule.random is close to 1', () => {
            // Mock randomModule.random to return a value just under 1 to select the maximum values.
            vi.spyOn(randomModule, "random").mockReturnValue(0.999999);

            const config = {digitsNum1: 2, digitsNum2: 1, maxDigits: 5, allowNegatives: false};
            const {num1, num2, answer} = generateSubtraction(config);

            // num1 should be its maximum: floor(0.99... * 11) + 10 = 20
            expect(num1).toBe(99);

            // maxSubtracted becomes min(20, 9) = 9
            // num2 should be its maximum: floor(0.99... * (9-1+1)) + 1 = 9
            expect(num2).toBe(9);

            expect(answer).toBe(90);
        });
    });

    describe('Digit Constraints', () => {
        it('should generate num1 with exact digitsNum1 and num2 with exact digitsNum2', () => {
            vi.spyOn(randomModule, "random")
                .mockReturnValueOnce(0.1) // For num1 (2 digits)
                .mockReturnValueOnce(0.5); // For num2 (1 digit)

            const config = { digitsNum1: 2, digitsNum2: 1, maxDigits: 5, allowNegatives: false };
            const { num1, num2 } = generateSubtraction(config);

            // num1 should be between 10 and 99 (inclusive)
            expect(num1).toBeGreaterThanOrEqual(10);
            expect(num1).toBeLessThanOrEqual(99);
            // num2 should be between 1 and 9 (inclusive)
            expect(num2).toBeGreaterThanOrEqual(1);
            expect(num2).toBeLessThanOrEqual(9);
        });
    });

});

describe('generateAddition', () => {

    // --- Standard Cases ---
    describe('Standard Operation', () => {// --- Casual Use Cases ---
        it('should correctly add single-digit numbers', () => {
            vi.spyOn(randomModule, "random").mockReturnValueOnce(7 / 9).mockReturnValueOnce(0);
            const config = {digitsNum1: 1, digitsNum2: 1, maxDigits: 5, allowNegatives: false};
            const {num1, num2, answer} = generateAddition(config);
            expect(num1).toBe(8);
            expect(num2).toBe(1);
            expect(answer).toBe(9);
        });

        it('should correctly add two-digit numbers', () => {
            vi.spyOn(randomModule, "random").mockReturnValueOnce(15 / 90).mockReturnValueOnce(65 / 90);
            const config = {digitsNum1: 2, digitsNum2: 2, maxDigits: 5, allowNegatives: false};
            const {num1, num2, answer} = generateAddition(config);
            expect(num1).toBe(25);
            expect(num2).toBe(75);
            expect(answer).toBe(100);
        });
    })

    // --- Boundary Cases ---
    describe('Boundary Cases', () => {

        it('should generate the minimum possible numbers when randomModule.random returns 0', () => {
            vi.spyOn(randomModule, "random").mockReturnValue(0);
            const config = {digitsNum1: 2, digitsNum2: 1, maxDigits: 5, allowNegatives: false};
            const {num1, num2, answer} = generateAddition(config);

            expect(num1).toBe(10);
            expect(num2).toBe(1);
            expect(answer).toBe(11);
        });

        it('should generate the maximum possible numbers when randomModule.random is close to 1', () => {
            vi.spyOn(randomModule, "random").mockReturnValue(0.999999);
            const config = {digitsNum1: 2, digitsNum2: 2, maxDigits: 5, allowNegatives: false};
            const {num1, num2, answer} = generateAddition(config);

            expect(num1).toBe(99);
            expect(num2).toBe(99);
            expect(answer).toBe(198);
        });

    });

    describe('when allowNegatives is true', () => {
        it('should correctly add two negative numbers', () => {
            vi.spyOn(randomModule, "random").mockReturnValueOnce(0).mockReturnValueOnce(0); // Selects minimum values
            const config = {digitsNum1: 2, digitsNum2: 2, maxDigits: 5, allowNegatives: true};
            const {num1, num2, answer} = generateAddition(config);

            expect(num1).toBe(-99);
            expect(num2).toBe(-99);
            expect(answer).toBe(-198);
        });

        it('should correctly add a positive and a negative number', () => {
            vi.spyOn(randomModule, "random").mockReturnValueOnce(0.999999).mockReturnValueOnce(0); // Selects maximum values
            const config = {digitsNum1: 2, digitsNum2: 2, maxDigits: 5, allowNegatives: true};
            const {num1, num2, answer} = generateAddition(config);

            expect(num1).toBe(99);
            expect(num2).toBe(-99);
            expect(answer).toBe(0);
        });
    });

    describe('Digit Constraints', () => {
        it('should generate num1 with exact digitsNum1 and num2 with exact digitsNum2', () => {
            vi.spyOn(randomModule, "random")
                .mockReturnValueOnce(0.1) // For num1 (2 digits)
                .mockReturnValueOnce(0.5); // For num2 (1 digit)

            const config = { digitsNum1: 2, digitsNum2: 1, maxDigits: 5, allowNegatives: false };
            const { num1, num2 } = generateAddition(config);

            // num1 should be between 10 and 99 (inclusive)
            expect(num1).toBeGreaterThanOrEqual(10);
            expect(num1).toBeLessThanOrEqual(99);
            // num2 should be between 1 and 9 (inclusive)
            expect(num2).toBeGreaterThanOrEqual(1);
            expect(num2).toBeLessThanOrEqual(9);
        });
    });
});

describe('generateMultiplication', () => {
    // --- Standard Cases ---
    describe('Standard Operation', () => {
        it('should multiply two numbers', () => {
            vi.spyOn(randomModule, "random").mockReturnValueOnce(0).mockReturnValueOnce(0); // Selects minimums
            const config = {digitsNum1: 2, digitsNum2: 2, maxDigits: 5, allowNegatives: false };
            const {num1, num2, answer} = generateMultiplication(config);

            expect(num1).toBe(10);
            expect(num2).toBe(10);
            expect(answer).toBe(100);
        });
    })
    describe('Boundary Cases', () => {
        it('should generate the minimum possible factors when randomModule.random returns 0', () => {
            vi.spyOn(randomModule, "random").mockReturnValueOnce(0).mockReturnValueOnce(0);
            const config = {digitsNum1: 1, digitsNum2: 1, maxDigits: 5, allowNegatives: false};
            const {num1, num2, answer} = generateMultiplication(config);

            expect(num1).toBe(1); // factor1
            expect(num2).toBe(1); // factor2
            expect(answer).toBe(1);
        });

        it('should generate the maximum possible factors when randomModule.random is close to 1', () => {
            vi.spyOn(randomModule, "random").mockReturnValueOnce(0.999999).mockReturnValueOnce(0.999999);
            const config = {digitsNum1: 1, digitsNum2: 1, maxDigits: 5, allowNegatives: false};
            const {num1, num2, answer} = generateMultiplication(config);

            expect(num1).toBe(9); // factor1
            expect(num2).toBe(9); // factor2
            expect(answer).toBe(81);
        });
    });

    describe('when allowNegatives is true', () => {
        it('should produce a positive result when multiplying two negative numbers', () => {
            vi.spyOn(randomModule, "random").mockReturnValueOnce(0).mockReturnValueOnce(0); // Selects minimums
            const config = {digitsNum1: 2, digitsNum2: 1, maxDigits: 5, allowNegatives: true};
            const {num1, num2, answer} = generateMultiplication(config);

            expect(num1).toBe(-99);
            expect(num2).toBe(-9);
            expect(answer).toBe(891);
        });

        it('should produce a negative result when multiplying a positive and a negative number', () => {
            vi.spyOn(randomModule, "random").mockReturnValueOnce(0.999999).mockReturnValueOnce(0); // Selects maximums
            const config = {digitsNum1: 1, digitsNum2: 1, maxDigits: 5, allowNegatives: true};
            const {num1, num2, answer} = generateMultiplication(config);

            expect(num1).toBe(9);
            expect(num2).toBe(-9);
            expect(answer).toBe(-81);
        });
    });

    describe('Digit Constraints', () => {
        it('should generate num1 with exact digitsNum1 and num2 with exact digitsNum2', () => {
            vi.spyOn(randomModule, "random")
                .mockReturnValueOnce(0.1) // For num1 (2 digits)
                .mockReturnValueOnce(0.5); // For num2 (1 digit)

            const config = { digitsNum1: 2, digitsNum2: 1, maxDigits: 5, allowNegatives: false };
            const { num1, num2 } = generateMultiplication(config);

            // num1 should be between 10 and 99 (inclusive)
            expect(num1).toBeGreaterThanOrEqual(10);
            expect(num1).toBeLessThanOrEqual(99);
            // num2 should be between 1 and 9 (inclusive)
            expect(num2).toBeGreaterThanOrEqual(1);
            expect(num2).toBeLessThanOrEqual(9);
        });
    });
});

describe('generateDivision', () => {
    // --- Standard Cases ---
    it('should generate a valid problem on the first attempt', () => {
        // Mock random to generate divisor=4, then quotient=2
        vi.spyOn(randomModule, "random")
            .mockReturnValueOnce(0.5) // floor(0.5 * (6-2+1)) + 2 = 4. Divisor is 4.
            .mockReturnValueOnce(0.3888888888888889); // maxQuotient=floor(20/4)=5. quotient=floor(0.388...*18)+2 = 7+2=9.

        const config = {digitsNum1: 2, digitsNum2: 1, maxDigits: 5, allowNegatives: false};
        const {num1, num2, answer} = generateDivision(config);

        expect(num2).toBe(5); // divisor
        expect(answer).toBe(9); // quotient
        expect(num1).toBe(45); // quotient * divisor
    });

    // --- Edge Cases & Loop Behavior ---
    it('should re-generate if the first divisor is 1', () => {
        vi.spyOn(randomModule, "random")
            // First attempt:
            .mockReturnValueOnce(0)      // Generates divisor = 1, which causes the loop to repeat.
            .mockReturnValueOnce(0.5)    // This generates quotient = 10. The loop condition (1 >= 1) is met.
            // Second attempt:
            .mockReturnValueOnce(0.5)    // Generates divisor = 3.
            .mockReturnValueOnce(0.4);   // With maxQuotient=6, this generates quotient = floor(0.4*6) = 2.

        const config = {digitsNum1: 2, digitsNum2: 1, maxDigits: 5, allowNegatives: false};
        const {num1, num2, answer} = generateDivision(config);

        // The test confirms the final, valid result after the loop
        expect(num2).toBe(5); // divisor
        expect(answer).toBe(9); // quotient
        expect(num1).toBe(45); // quotient * divisor
        expect(randomModule.random).toHaveBeenCalledTimes(4);
    });

    it('should re-generate if the first quotient is 0 or 1', () => {
        vi.spyOn(randomModule, "random")
            // First attempt:
            .mockReturnValueOnce(0.5) // Generates divisor = 4.
            .mockReturnValueOnce(0.1) // With maxQuotient=5, this generates quotient = 0, which causes the loop to repeat.
            // Second attempt:
            .mockReturnValueOnce(0.8) // Generates divisor = 5.
            .mockReturnValueOnce(0.5); // With maxQuotient=4, this generates quotient = 2.

        const config = {digitsNum1: 2, digitsNum2: 1, maxDigits: 5, allowNegatives: false};
        const {num1, num2, answer} = generateDivision(config);

        expect(num2).toBe(5); // Final divisor
        expect(answer).toBe(3); // Final quotient
        expect(num1).toBe(15);
        expect(randomModule.random).toHaveBeenCalledTimes(2);
    });


    describe('when allowNegatives is true', () => {
        it('should correctly divide when the divisor is negative', () => {
            // This test mocks randomModule.random to produce a specific, non-trivial result.
            // 1st call to random() generates the divisor.
            // 2nd call to random() generates the quotient.
            vi.spyOn(randomModule, "random")
                .mockReturnValueOnce(0)      // Will produce divisor = -9.
                .mockReturnValueOnce(0.7);   // With maxQuotient=11, minQuotient=-11, will produce quotient = 5.

            const config = {digitsNum1: 2, digitsNum2: 1, maxDigits: 5, allowNegatives: true};
            const {num1, num2, answer} = generateDivision(config);

            expect(num2).toBe(-9);   // divisor
            expect(answer).toBe(5); // quotient
            expect(num1).toBe(-45);   // quotient * divisor
        })

        it('should correctly divide a negative number by a positive number', () => {
            vi.spyOn(randomModule, "random")
                .mockReturnValueOnce(0.999999) // divisor = 9
                .mockReturnValueOnce(0.27); // With maxQuotient=11, minQuotient=-11, will produce quotient = -5.

            // This test requires minNum1 to be passed for negative dividends
            const config = {digitsNum1: 2, digitsNum2: 1, maxDigits: 5, allowNegatives: true};
            const {num1, num2, answer} = generateDivision(config);

            expect(num2).toBe(9);
            expect(answer).toBe(-5);
            expect(num1).toBe(-45);
        });
    });

    describe('Digit Constraints', () => {
        it('should generate num1 with exact digitsNum1 and num2 with exact digitsNum2', () => {
            vi.spyOn(randomModule, "random")
                .mockReturnValueOnce(0.1) // For num1 (2 digits)
                .mockReturnValueOnce(0.5); // For num2 (1 digit)

            const config = { digitsNum1: 2, digitsNum2: 1, maxDigits: 5, allowNegatives: false };
            const { num1, num2 } = generateDivision(config);

            // num1 should be between 10 and 99 (inclusive)
            expect(num1).toBeGreaterThanOrEqual(10);
            expect(num1).toBeLessThanOrEqual(99);
            // num2 should be between 1 and 9 (inclusive)
            expect(num2).toBeGreaterThanOrEqual(1);
            expect(num2).toBeLessThanOrEqual(9);
        });
    });
});