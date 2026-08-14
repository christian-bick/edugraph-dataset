import {describe, expect, it} from 'vitest';
import {Area, Scope} from 'edugraph-ts';
import {setSeed} from '../../lib/random.ts';
import {generateWithLabels} from '../../lib/utils.ts';
import {ComparisonGenerator} from './generator.ts';

describe('ComparisonGenerator Spec Integration', () => {
    const generator = new ComparisonGenerator();

    it('should resolve relation and nonzero labels into valid samples', () => {
        for (const [comparisonKind, relation] of [
            [Area.NumericInequality, Scope.Less],
            [Area.NumericEquality, Scope.Equal],
            [Area.NumericInequality, Scope.Greater]
        ] as const) {
            for (let seed = 0; seed < 20; seed++) {
                setSeed(seed);
                const stub = generateWithLabels(generator, [
                    comparisonKind,
                    relation,
                    Scope.NumbersSmaller20,
                    Scope.NumbersWithoutNegatives,
                    Scope.NumbersWithoutZero
                ]);
                expect(stub).not.toBeNull();
                expect([stub!.data.num1, stub!.data.num2]).not.toContain(0);
                expect(stub!.tags).toEqual(expect.arrayContaining([
                    comparisonKind,
                    relation,
                    Scope.NumbersWithoutNegatives,
                    Scope.NumbersWithoutZero
                ]));
            }
        }
    });

    it('rejects equality areas paired with unequal scopes and vice versa', () => {
        for (const labels of [
            [Area.NumericEquality, Scope.Less],
            [Area.NumericInequality, Scope.Equal]
        ]) {
            expect(() => generateWithLabels(generator, [
                ...labels,
                Scope.NumbersSmaller20,
                Scope.NumbersWithoutNegatives,
                Scope.NumbersWithoutZero
            ])).toThrow();
        }
    });

    it('should resolve zero and negative labels into observable witnesses', () => {
        for (const relation of [Scope.Less, Scope.Greater]) {
            for (let seed = 0; seed < 20; seed++) {
                setSeed(seed);
                const stub = generateWithLabels(generator, [
                    Area.NumericInequality,
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
