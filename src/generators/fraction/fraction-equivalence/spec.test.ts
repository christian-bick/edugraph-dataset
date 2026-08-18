import {Ability, Area, Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {setSeed} from '../../../lib/random.ts';
import {generateWithLabels, labelSetHash} from '../../../lib/utils.ts';
import {FractionEquivalenceGenerator} from './generator.ts';
import {spec} from './spec.ts';

describe('FractionEquivalenceGenerator spec integration', () => {
    const generator = new FractionEquivalenceGenerator();

    it('declares exactly the invariant equivalence capabilities', () => {
        expect(spec).toEqual({
            generatorId: 'fraction-equivalence',
            generalLabels: [
                Area.FractionEquivalence,
                Area.FractionNotation,
                Scope.Equal
            ]
        });
    });

    it.each([
        [[Ability.ConceptClassification], 'recognize-equivalence'],
        [[Ability.Formalization, Ability.ProcedureUnderstanding], 'generate-equivalence']
    ] as const)('resolves the exact %j mode', (taskAbilities, expectedTask) => {
        setSeed(expectedTask);
        const stub = generateWithLabels(generator, [
            Area.FractionEquivalence,
            Area.FractionNotation,
            Scope.EqualShares,
            Scope.Equal,
            ...taskAbilities
        ]);

        expect(stub).not.toBeNull();
        expect(stub!.data.task).toBe(expectedTask);
        expect(stub!.tags).toEqual(expect.arrayContaining([...taskAbilities]));
    });

    it('resolves whole-number formalization without EqualShares', () => {
        setSeed('whole-number-fraction');
        const stub = generateWithLabels(generator, [
            Area.FractionEquivalence,
            Area.FractionNotation,
            Scope.ImproperFractions,
            Scope.IntegerNumbers,
            Scope.Equal,
            Ability.Formalization
        ]);

        expect(stub).not.toBeNull();
        expect(stub!.data.task).toBe('represent-whole-as-fraction');
        expect(stub!.tags).toEqual(expect.arrayContaining([
            Scope.ImproperFractions,
            Scope.IntegerNumbers,
            Ability.Formalization
        ]));
        expect(stub!.tags).not.toContain(Scope.EqualShares);
    });

    it.each([
        [Scope.VisualNumbers, 'd2b490fc'],
        [Scope.Numberline, '9db6415f']
    ] as const)('resolves the corrected Grade 4 %s scaling target', (representation, hash) => {
        const labels = [
            Area.FractionEquivalence,
            Area.FractionNotation,
            Area.Multiplication,
            Scope.EqualShares,
            Scope.Equal,
            Scope.SingleFrameOfReference,
            Ability.ProcedureUnderstanding,
            Ability.Formalization,
            representation
        ];
        expect(labelSetHash(labels)).toBe(hash);
        setSeed(hash);
        const stub = generateWithLabels(generator, labels);

        expect(stub).not.toBeNull();
        expect(stub!.data.task).toBe('scale-equivalence');
        expect(stub!.tags).toEqual(expect.arrayContaining([
            Area.Multiplication,
            Ability.ProcedureUnderstanding,
            Ability.Formalization
        ]));
        expect(stub!.tags).not.toContain(Scope.SingleFrameOfReference);
        expect(stub!.tags).not.toContain(representation);
    });

    it('resolves the corrected denominator-ten to denominator-hundred target', () => {
        const labels = [
            Area.FractionEquivalence,
            Area.FractionNotation,
            Area.Multiplication,
            Scope.EqualShares,
            Scope.Equal,
            Scope.SingleFrameOfReference,
            Scope.VisualNumbers,
            Ability.Formalization
        ];
        expect(labelSetHash(labels)).toBe('4b26e9d5');
        setSeed('4b26e9d5');
        const stub = generateWithLabels(generator, labels);

        expect(stub).not.toBeNull();
        expect(stub!.data.task).toBe('tenths-to-hundredths');
        expect(stub!.tags).toEqual(expect.arrayContaining([
            Area.Multiplication,
            Scope.EqualShares,
            Ability.Formalization
        ]));
        expect(stub!.tags).not.toContain(Scope.SingleFrameOfReference);
        expect(stub!.tags).not.toContain(Scope.VisualNumbers);
    });

    it('keeps classification label extraction on the identical random path', () => {
        const labels = [
            Area.FractionEquivalence,
            Area.FractionNotation,
            Scope.EqualShares,
            Scope.Equal,
            Ability.ConceptClassification
        ];
        setSeed('legacy-label-extraction');
        const resolved = generateWithLabels(generator, labels);
        setSeed('legacy-label-extraction');
        const direct = generator.generate({
            taskAbilities: [Ability.ConceptClassification],
            usesMultiplication: false,
            usesEqualShares: true,
            usesImproperFractions: false,
            usesIntegerNumbers: false
        });

        expect(resolved!.data).toEqual(direct.data);
        expect(resolved!.tags).not.toContain(Area.Multiplication);
    });
});
