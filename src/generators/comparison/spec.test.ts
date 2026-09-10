import {describe, expect, it} from 'vitest';
import {Ability, Area, Scope} from 'edugraph-ts';
import {setSeed} from '../../lib/random.ts';
import {generateWithLabels} from '../../lib/utils.ts';
import {ComparisonGenerator} from './generator.ts';
import {spec} from './spec.ts';

describe('ComparisonGenerator Spec Integration', () => {
    const generator = new ComparisonGenerator();

    it('keeps representation capabilities out of the canonical relation', () => {
        expect(spec.generalLabels).toEqual([Scope.IntegerNumbers]);
    });

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
    ] as const)('resolves the concrete Grade 4 relation %s', (relation, resolved, _symbol) => {
        const resolvedArea = relation === Scope.Equal
            ? Area.NumericEquality
            : Area.NumericInequality;
        const stub = generateWithLabels(generator, [
            resolvedArea,
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
            resolvedArea,
            relation,
            Scope.NumbersLarger1000,
            Scope.NumbersSmaller1000000
        ]));
        expect(stub!.labels).not.toContain(Area.NumericComparison);
    });

    it('completes a concrete relation when the target leaves it unspecified', () => {
        setSeed('comparison-relation-fallback');
        const stub = generateWithLabels(generator, [
            Scope.NumbersSmaller20,
            Scope.NumbersWithoutNegatives,
            Scope.NumbersWithoutZero
        ]);

        expect(stub).not.toBeNull();
        expect(stub!.labels.some(label => [
            Area.NumericEquality,
            Area.NumericInequality
        ].includes(label as Area))).toBe(true);
        expect(stub!.labels).not.toContain(Area.NumericComparison);
        expect(stub!.labels.some(label => [Scope.Less, Scope.Equal, Scope.Greater].includes(label as Scope))).toBe(true);
    });
});
