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
            Scope.EqualShares,
            Scope.ProperFractions,
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
        [Scope.VisualNumbers, '0ea3b2ba'],
        [Scope.Numberline, 'e2c38541']
    ] as const)('uses a deterministic seeded scaling model for the Grade 4 %s target', (representation, hash) => {
        const labels = [
            Area.FractionEquivalence,
            Area.Multiplication,
            Scope.EqualShares,
            Scope.Equal,
            Scope.TenthFractions,
            Scope.SingleFrameOfReference,
            Ability.ProcedureUnderstanding,
            Ability.Formalization,
            representation
        ];
        expect(labelSetHash(labels)).toBe(hash);
        setSeed(hash);
        const stub = generateWithLabels(generator, labels);
        setSeed(hash);
        const repeated = generateWithLabels(generator, labels);

        expect(stub).not.toBeNull();
        expect(repeated!.data).toEqual(stub!.data);
        if (stub!.data.task !== 'tenths-to-hundredths') {
            throw new Error('Expected the exact 10-to-100 denominator relation.');
        }
        expect(stub!.data.scaleFactor).toBe(10);
        expect(stub!.tags).toContain(Area.Multiplication);
        expect(stub!.tags).toContain(Scope.TenthFractions);
        expect(stub!.tags).not.toContain(Ability.ProcedureUnderstanding);
        expect(stub!.tags).not.toContain(Ability.Formalization);
        expect(stub!.tags).not.toContain(Scope.SingleFrameOfReference);
        expect(stub!.tags).not.toContain(representation);
    });

    it('keeps the seeded multiplication model independent of the requested Ability', () => {
        const labels = [
            Area.FractionEquivalence,
            Area.Multiplication,
            Scope.EqualShares,
            Scope.Equal,
            Scope.TenthFractions,
            Scope.SingleFrameOfReference,
            Scope.VisualNumbers,
            Ability.Formalization
        ];
        expect(labelSetHash(labels)).toBe('8d4de1af');
        setSeed('shared-base-ten-model');
        const formalization = generateWithLabels(generator, labels);
        setSeed('shared-base-ten-model');
        const procedure = generateWithLabels(generator, [
            ...labels,
            Ability.ProcedureUnderstanding
        ]);

        expect(formalization).not.toBeNull();
        expect(procedure!.data).toEqual(formalization!.data);
        expect(formalization!.tags).not.toContain(Ability.Formalization);
    });
});
