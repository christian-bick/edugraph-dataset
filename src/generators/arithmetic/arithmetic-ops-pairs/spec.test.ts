import { beforeEach, describe, expect, it } from 'vitest';
import { ArithmeticOpsPairsGenerator } from './generator.ts';
import { setSeed } from '../../../lib/random.ts';
import { Area, Scope } from 'edugraph-ts';
import { generateWithLabels } from '../../../lib/utils.ts';

describe('ArithmeticOpsPairsGenerator Spec Integration', () => {
    let generator: ArithmeticOpsPairsGenerator;

    beforeEach(() => {
        generator = new ArithmeticOpsPairsGenerator();
        setSeed(42);
    });

    it('should generate correct addition/subtraction/multiplication/division problems using labels', () => {
        const addStub = generateWithLabels(generator, [
            Area.Addition,
            Scope.NumbersWithoutNegatives,
            Scope.NumbersWithoutZero,
            Scope.NumbersSmaller10
        ]);
        expect(addStub).not.toBeNull();
        expect(addStub!.data.operation).toBe('addition');

        const subStub = generateWithLabels(generator, [
            Area.Subtraction,
            Scope.NumbersWithoutNegatives,
            Scope.NumbersWithoutZero,
            Scope.NumbersSmaller10
        ]);
        expect(subStub).not.toBeNull();
        expect(subStub!.data.operation).toBe('subtraction');

        const mulStub = generateWithLabels(generator, [
            Area.Multiplication,
            Scope.NumbersWithoutNegatives,
            Scope.NumbersWithoutZero,
            Scope.NumbersSmaller10
        ]);
        expect(mulStub).not.toBeNull();
        expect(mulStub!.data.operation).toBe('multiplication');

        const divStub = generateWithLabels(generator, [
            Area.Division,
            Scope.NumbersWithoutNegatives,
            Scope.NumbersWithoutZero,
            Scope.NumbersSmaller10
        ]);
        expect(divStub).not.toBeNull();
        expect(divStub!.data.operation).toBe('division');
        expect(divStub!.data.num1).toBe(divStub!.data.answer * divStub!.data.num2);

        const zeroNegStub = generateWithLabels(generator, [
            Area.Addition,
            Scope.NumbersWithNegatives,
            Scope.NumbersWithZero,
            Scope.NumbersSmaller10
        ]);
        expect(zeroNegStub).not.toBeNull();
    });

    it('should generate correct multiplication/division problems with zero allowed', () => {
        // Run multiple times to cover both branches in multiplication zero assignment
        for (let i = 0; i < 20; i++) {
            const mulStub = generateWithLabels(generator, [
                Area.Multiplication,
                Scope.NumbersWithoutNegatives,
                Scope.NumbersWithZero,
                Scope.NumbersSmaller10
            ]);
            expect(mulStub).not.toBeNull();
            expect(mulStub!.data.operation).toBe('multiplication');
        }

        const divStub = generateWithLabels(generator, [
            Area.Division,
            Scope.NumbersWithoutNegatives,
            Scope.NumbersWithZero,
            Scope.NumbersSmaller10
        ]);
        expect(divStub).not.toBeNull();
        expect(divStub!.data.operation).toBe('division');
    });

    it('should respect physical range bounds when using labels', () => {
        const addStub = generateWithLabels(generator, [
            Area.Addition,
            Scope.NumbersWithoutNegatives,
            Scope.NumbersWithoutZero,
            Scope.NumbersSmaller10
        ]);
        expect(addStub).not.toBeNull();
        expect(addStub!.data.operation).toBe('addition');
        expect(addStub!.data.num1).toBeGreaterThanOrEqual(1);
        expect(addStub!.data.num2).toBeGreaterThanOrEqual(1);
        expect(addStub!.data.answer).toBeLessThanOrEqual(10);
        expect(addStub!.data.num1 + addStub!.data.num2).toBe(addStub!.data.answer);

        const subStub = generateWithLabels(generator, [
            Area.Subtraction,
            Scope.NumbersWithoutNegatives,
            Scope.NumbersWithZero,
            Scope.NumbersSmaller10
        ]);
        expect(subStub).not.toBeNull();
        expect(subStub!.data.operation).toBe('subtraction');
        expect(subStub!.data.num1).toBeLessThanOrEqual(10);
        expect(subStub!.data.num1).toBeGreaterThanOrEqual(subStub!.data.num2);
        expect(subStub!.data.answer).toBeGreaterThanOrEqual(0);
        expect(subStub!.data.num1 - subStub!.data.num2).toBe(subStub!.data.answer);
    });

    it('should generate negative operands and results when Scope.NumbersWithNegatives is provided', () => {
        let hasNegativeNum = false;
        for (let i = 0; i < 50; i++) {
            const addStub = generateWithLabels(generator, [
                Area.Addition,
                Scope.NumbersWithNegatives,
                Scope.NumbersWithZero,
                Scope.NumbersSmaller10
            ]);
            expect(addStub).not.toBeNull();
            const { num1, num2, answer } = addStub!.data;
            expect(num1 + num2).toBe(answer);
            expect(Math.abs(num1)).toBeLessThanOrEqual(10);
            expect(Math.abs(num2)).toBeLessThanOrEqual(10);
            expect(Math.abs(answer)).toBeLessThanOrEqual(10);
            if (num1 < 0 || num2 < 0 || answer < 0) {
                hasNegativeNum = true;
            }
        }
        expect(hasNegativeNum).toBe(true);

        hasNegativeNum = false;
        for (let i = 0; i < 50; i++) {
            const subStub = generateWithLabels(generator, [
                Area.Subtraction,
                Scope.NumbersWithNegatives,
                Scope.NumbersWithZero,
                Scope.NumbersSmaller10
            ]);
            expect(subStub).not.toBeNull();
            const { num1, num2, answer } = subStub!.data;
            expect(num1 - num2).toBe(answer);
            expect(Math.abs(num1)).toBeLessThanOrEqual(10);
            expect(Math.abs(num2)).toBeLessThanOrEqual(10);
            expect(Math.abs(answer)).toBeLessThanOrEqual(10);
            if (num1 < 0 || num2 < 0 || answer < 0) {
                hasNegativeNum = true;
            }
        }
        expect(hasNegativeNum).toBe(true);
    });

    it('should respect Scope.NumbersWithoutZero and never generate 0 for any operand or answer', () => {
        for (let i = 0; i < 50; i++) {
            const addStub = generateWithLabels(generator, [
                Area.Addition,
                Scope.NumbersWithNegatives,
                Scope.NumbersWithoutZero,
                Scope.NumbersSmaller10
            ]);
            expect(addStub).not.toBeNull();
            const { num1, num2, answer } = addStub!.data;
            expect(num1).not.toBe(0);
            expect(num2).not.toBe(0);
            expect(answer).not.toBe(0);
        }

        for (let i = 0; i < 50; i++) {
            const subStub = generateWithLabels(generator, [
                Area.Subtraction,
                Scope.NumbersWithNegatives,
                Scope.NumbersWithoutZero,
                Scope.NumbersSmaller10
            ]);
            expect(subStub).not.toBeNull();
            const { num1, num2, answer } = subStub!.data;
            expect(num1).not.toBe(0);
            expect(num2).not.toBe(0);
            expect(answer).not.toBe(0);
        }
    });
});
