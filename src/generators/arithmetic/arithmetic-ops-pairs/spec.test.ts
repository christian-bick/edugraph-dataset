import {Ability, Area, Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {setSeed} from '../../../lib/random.ts';
import {generateWithLabels} from '../../../lib/utils.ts';
import {ArithmeticOpsPairsGenerator} from './generator.ts';
import {spec} from './spec.ts';

const operations = [Area.Addition, Area.Subtraction, Area.Multiplication, Area.Division] as const;

describe('ArithmeticOpsPairsGenerator Spec Integration', () => {
    const generator = new ArithmeticOpsPairsGenerator();

    it('declares its invariant binary operand cardinality', () => {
        expect(spec.generalLabels).toContain(Scope.TwoOperands);
    });

    it('resolves nonzero and nonnegative labels into universally valid samples', () => {
        for (const operation of operations) {
            for (let seed = 0; seed < 20; seed++) {
                setSeed(seed);
                const stub = generateWithLabels(generator, [
                    operation,
                    Scope.NumbersWithoutNegatives,
                    Scope.NumbersWithoutZero,
                    Scope.NumbersSmaller10
                ]);
                expect(stub).not.toBeNull();
                const values = [stub!.data.num1, stub!.data.num2, stub!.data.answer];
                expect(values.includes(0)).toBe(false);
                expect(values.some(value => value < 0)).toBe(false);
                expect(stub!.tags).toEqual(expect.arrayContaining([
                    operation,
                    Scope.NumbersWithoutNegatives,
                    Scope.NumbersWithoutZero
                ]));
            }
        }
    });

    it('resolves zero and negative labels into witnesses for every operation', () => {
        for (const operation of operations) {
            for (let seed = 0; seed < 20; seed++) {
                setSeed(seed);
                const stub = generateWithLabels(generator, [
                    operation,
                    Scope.NumbersWithNegatives,
                    Scope.NumbersWithZero,
                    Scope.NumbersSmaller10
                ]);
                expect(stub).not.toBeNull();
                const values = [stub!.data.num1, stub!.data.num2, stub!.data.answer];
                expect(values).toContain(0);
                expect(values.some(value => value < 0)).toBe(true);
            }
        }
    });

    it('resolves multiples of ten into operation-appropriate witnesses', () => {
        for (const operation of operations) {
            const stub = generateWithLabels(generator, [
                operation,
                Scope.MultiplesOf10,
                Scope.NumbersWithoutNegatives,
                Scope.NumbersWithoutZero,
                Scope.NumbersSmaller1000
            ]);
            expect(stub).not.toBeNull();
            if (operation === Area.Multiplication) {
                const factors = [stub!.data.num1, stub!.data.num2];
                expect(factors.filter(value => value >= 1 && value <= 9)).toHaveLength(1);
                expect(factors.filter(value => value >= 10 && value <= 90 && value % 10 === 0)).toHaveLength(1);
                expect(stub!.data.answer % 10).toBe(0);
            } else {
                expect([stub!.data.num1, stub!.data.num2, stub!.data.answer]
                    .every(value => value % 10 === 0)).toBe(true);
            }
            expect(stub!.tags).toContain(Scope.MultiplesOf10);
        }
    });

    it('resolves procedure inversion into the pair payload only', () => {
        const stub = generateWithLabels(generator, [
            Area.Addition,
            Ability.ProcedureInversion,
            Scope.NumbersWithoutNegatives,
            Scope.NumbersWithoutZero,
            Scope.NumbersSmaller10
        ]);
        expect(stub).not.toBeNull();
        expect(stub!.data.blankPart).toBe('num2');
        expect(stub!.tags).toContain(Ability.ProcedureInversion);
    });

    it('resolves iterated addition into equal addend values and an even result', () => {
        for (let seed = 0; seed < 20; seed++) {
            setSeed(seed);
            const stub = generateWithLabels(generator, [
                Area.Addition,
                Area.IteratedOperation,
                Scope.EvenNumbers,
                Scope.NumbersSmaller20
            ]);
            expect(stub).not.toBeNull();
            expect(stub!.data.num1).toBe(stub!.data.num2);
            expect(stub!.data.answer % 2).toBe(0);
            expect(stub!.data.answer).toBeLessThanOrEqual(20);
        }
    });

    it('does not infer an arithmetic operation from Difference alone', () => {
        const stub = generateWithLabels(generator, [
            Area.Difference,
            Scope.NumbersWithoutNegatives,
            Scope.NumbersSmaller20
        ]);
        expect(stub).toBeNull();
    });
});
