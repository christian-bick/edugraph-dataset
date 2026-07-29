import {describe, expect, it} from 'vitest';
import {Ability, Area, Scope} from 'edugraph-ts';
import {setSeed} from '../../../lib/random.ts';
import {generateWithLabels} from '../../../lib/utils.ts';
import {ArithmeticOpsPairsGenerator} from './generator.ts';

const operations = [Area.Addition, Area.Subtraction, Area.Multiplication, Area.Division] as const;

describe('ArithmeticOpsPairsGenerator Spec Integration', () => {
    const generator = new ArithmeticOpsPairsGenerator();

    it('should resolve nonzero and nonnegative labels into universally valid samples', () => {
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

    it('should resolve zero and negative labels into witnesses for every operation', () => {
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
                expect(stub!.tags).toEqual(expect.arrayContaining([
                    operation,
                    Scope.NumbersWithNegatives,
                    Scope.NumbersWithZero
                ]));
            }
        }
    });

    it('should resolve procedure inversion into the missing second operand', () => {
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
});
