import {describe, expect, it} from 'vitest';
import {Scope} from 'edugraph-ts';
import {setSeed} from '../../lib/random.ts';
import {generateWithLabels} from '../../lib/utils.ts';
import {ComparisonGenerator} from './generator.ts';

describe('ComparisonGenerator Spec Integration', () => {
    const generator = new ComparisonGenerator();

    it('should resolve relation and nonzero labels into valid samples', () => {
        for (const relation of [Scope.Less, Scope.Equal, Scope.Greater]) {
            for (let seed = 0; seed < 20; seed++) {
                setSeed(seed);
                const stub = generateWithLabels(generator, [
                    relation,
                    Scope.NumbersSmaller20,
                    Scope.NumbersWithoutNegatives,
                    Scope.NumbersWithoutZero
                ]);
                expect(stub).not.toBeNull();
                expect([stub!.data.num1, stub!.data.num2]).not.toContain(0);
                expect(stub!.tags).toEqual(expect.arrayContaining([
                    relation,
                    Scope.NumbersWithoutNegatives,
                    Scope.NumbersWithoutZero
                ]));
            }
        }
    });

    it('should resolve zero and negative labels into observable witnesses', () => {
        for (const relation of [Scope.Less, Scope.Greater]) {
            for (let seed = 0; seed < 20; seed++) {
                setSeed(seed);
                const stub = generateWithLabels(generator, [
                    relation,
                    Scope.NumbersWithZero,
                    Scope.NumbersWithNegatives,
                    Scope.NumbersSmaller10
                ]);
                expect(stub).not.toBeNull();
                const values = [stub!.data.num1, stub!.data.num2];
                expect(values).toContain(0);
                expect(values.some(value => value < 0)).toBe(true);
                expect(stub!.tags).toEqual(expect.arrayContaining([
                    Scope.NumbersWithZero,
                    Scope.NumbersWithNegatives
                ]));
            }
        }
    });
});
