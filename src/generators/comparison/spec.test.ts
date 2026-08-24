import {describe, expect, it} from 'vitest';
import {Ability, Area, Scope} from 'edugraph-ts';
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
                expect(stub!.labels).toEqual(expect.arrayContaining([
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
                expect(stub!.labels).toEqual(expect.arrayContaining([
                    Scope.NumbersWithZero,
                    Scope.NumbersWithNegatives
                ]));
            }
        }
    });

    it.each([
        [Scope.Less, 'less', '<'],
        [Scope.Equal, 'equal', '='],
        [Scope.Greater, 'greater', '>']
    ] as const)('resolves Grade 4 NumericComparison %s', (relation, resolved, _symbol) => {
        const stub = generateWithLabels(generator, [
            Area.NumericComparison,
            relation,
            Scope.ArabicNumerals,
            Scope.Base10,
            Scope.NumbersLarger1000,
            Scope.NumbersSmaller1000000,
            Scope.NumbersWithoutNegatives,
            Scope.NumbersWithoutZero,
            Ability.ProcedureExecution
        ]);

        expect(stub).not.toBeNull();
        expect(stub!.data).toMatchObject({
            task: 'multi-digit-place-value-comparison',
            relation: resolved
        });
        expect(stub!.labels).toEqual(expect.arrayContaining([
            Area.NumericComparison,
            relation,
            Scope.NumbersLarger1000,
            Scope.NumbersSmaller1000000
        ]));
    });

    it('resolves an explicit relation capability for a broad comparison target', () => {
        setSeed('comparison-relation-fallback');
        const stub = generateWithLabels(generator, [
            Area.NumericComparison,
            Scope.NumbersSmaller20,
            Scope.NumbersWithoutNegatives,
            Scope.NumbersWithoutZero
        ]);

        expect(stub).not.toBeNull();
        expect(stub!.labels).toContain(Area.NumericComparison);
        expect(stub!.labels.some(label => [Scope.Less, Scope.Equal, Scope.Greater].includes(label as Scope))).toBe(true);
    });
});
