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
        {taskAbilities: [Ability.ConceptClassification]},
        {taskAbilities: [Ability.Formalization, Ability.ProcedureUnderstanding]}
    ] as const)('keeps the proper-fraction model neutral for $taskAbilities', ({taskAbilities}) => {
        setSeed('proper-equivalence');
        const stub = generateWithLabels(generator, [
            Area.FractionEquivalence,
            Area.FractionNotation,
            Scope.EqualShares,
            Scope.Equal,
            ...taskAbilities
        ]);

        expect(stub).not.toBeNull();
        expect(stub!.data.task).toBe('relate-equivalent-fractions');
        expect(stub!.tags).not.toEqual(expect.arrayContaining([...taskAbilities]));
    });

    it('resolves whole-number mathematics without consuming Formalization', () => {
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
            Scope.IntegerNumbers
        ]));
        expect(stub!.tags).not.toContain(Ability.Formalization);
        expect(stub!.tags).not.toContain(Scope.EqualShares);
    });

    it.each([
        [Scope.VisualNumbers, 'd2b490fc'],
        [Scope.Numberline, '9db6415f']
    ] as const)('uses one base-ten scaling model for the Grade 4 %s target', (representation, hash) => {
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
        expect(stub!.data.task).toBe('tenths-to-hundredths');
        expect(stub!.tags).toContain(Area.Multiplication);
        expect(stub!.tags).not.toContain(Ability.ProcedureUnderstanding);
        expect(stub!.tags).not.toContain(Ability.Formalization);
        expect(stub!.tags).not.toContain(Scope.SingleFrameOfReference);
        expect(stub!.tags).not.toContain(representation);
    });

    it('resolves the denominator-ten to denominator-hundred target identically', () => {
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
        setSeed('shared-base-ten-model');
        const formalization = generateWithLabels(generator, labels);
        setSeed('shared-base-ten-model');
        const procedure = generateWithLabels(generator, [
            ...labels,
            Ability.ProcedureUnderstanding
        ]);

        expect(formalization).not.toBeNull();
        expect(formalization!.data.task).toBe('tenths-to-hundredths');
        expect(procedure!.data).toEqual(formalization!.data);
        expect(formalization!.tags).not.toContain(Ability.Formalization);
    });
});
