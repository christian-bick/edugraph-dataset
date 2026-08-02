import {describe, expect, it} from 'vitest';
import {Area, Scope} from 'edugraph-ts';
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

    it('should resolve multiples-of-ten into universally valid terms', () => {
        for (const operation of operations) {
            const stub = generateWithLabels(generator, [
                operation,
                Scope.MultiplesOf10,
                Scope.NumbersWithoutNegatives,
                Scope.NumbersWithoutZero,
                Scope.NumbersSmaller1000
            ]);
            expect(stub).not.toBeNull();
            expect([stub!.data.num1, stub!.data.num2, stub!.data.answer]
                .every(value => value % 10 === 0)).toBe(true);
            expect(stub!.tags).toContain(Scope.MultiplesOf10);
        }
    });

    it('should resolve Area.Sum into a three-addend addition problem', () => {
        for (let seed = 0; seed < 20; seed++) {
            setSeed(seed);
            const stub = generateWithLabels(generator, [
                Area.Addition,
                Area.Sum,
                Scope.NumbersWithoutNegatives,
                Scope.NumbersSmaller20
            ]);
            expect(stub).not.toBeNull();
            expect(stub!.data.num3).toBeTypeOf('number');
            expect(stub!.data.num1 + stub!.data.num2 + stub!.data.num3!).toBe(stub!.data.answer);
            expect(stub!.tags).toContain(Area.Sum);
        }
    });

    it.each([
        [Area.CommutativeLaw, 'commutative', false],
        [Area.AssociativeLaw, 'associative', true]
    ] as const)('should resolve %s into its arithmetic-law payload', (law, propertyLaw, expectsThird) => {
        const stub = generateWithLabels(generator, [
            Area.Addition,
            law,
            Scope.NumbersWithoutNegatives,
            Scope.NumbersSmaller20
        ]);

        expect(stub).not.toBeNull();
        expect(stub!.data.propertyLaw).toBe(propertyLaw);
        expect(stub!.data.num3 !== undefined).toBe(expectsThird);
        expect(stub!.tags).toContain(law);
    });

    it('should not infer a random arithmetic operation from Area.Difference alone', () => {
        const stub = generateWithLabels(generator, [
            Area.Difference,
            Scope.NumbersWithoutNegatives,
            Scope.NumbersSmaller20
        ]);

        expect(stub).toBeNull();
    });
});
