import {Ability, Area, Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {setSeed} from '../../../lib/random.ts';
import {generateWithLabels} from '../../../lib/utils.ts';
import {ArithmeticPatternsGenerator} from './generator.ts';
import {spec} from './spec.ts';

describe('ArithmeticPatternsGenerator spec integration', () => {
    const generator = new ArithmeticPatternsGenerator();

    it('keeps only invariant numeric scopes in general capabilities', () => {
        expect(spec.generalLabels).toEqual([
            Scope.IntegerNumbers,
            Scope.Base10,
            Scope.NumbersWithoutNegatives
        ]);
        expect(generator.schema).toHaveProperty('model');
        expect(generator.schema).not.toHaveProperty('task');
    });

    it.each([
        [[Area.GenerativeRuleRecognition], 'operation-table'],
        [[Area.PatternGeneration], 'recurrence'],
        [[Area.EmergentFeatureRecognition], 'recurrence'],
        [[Area.PatternGeneration, Area.EmergentFeatureRecognition], 'recurrence']
    ] as const)('resolves %j to the %s canonical model', (patternAreas, model) => {
        setSeed(17);
        const stub = generateWithLabels(generator, [
            Area.Addition,
            ...patternAreas,
            Ability.ProcedureExecution,
            Ability.ConceptClassification
        ])!;

        expect(stub.data.kind).toBe(model);
        expect(stub.labels).toEqual(expect.arrayContaining([Area.Addition, ...patternAreas]));
        expect(stub.labels).not.toContain(Ability.ProcedureExecution);
        expect(stub.labels).not.toContain(Ability.ConceptClassification);
    });

    it.each([
        [Area.Addition, Area.CommutativeLaw, 'commutative'],
        [Area.Addition, Area.AssociativeLaw, 'associative'],
        [Area.Multiplication, Area.CommutativeLaw, 'commutative'],
        [Area.Multiplication, Area.AssociativeLaw, 'associative'],
        [Area.Multiplication, Area.DistributiveLaw, 'distributive']
    ] as const)('preserves the %s %s mathematical witness', (operation, law, propertyLaw) => {
        setSeed(29);
        const stub = generateWithLabels(generator, [
            operation,
            law,
            Area.EmergentFeatureRecognition,
            Ability.ProcedureUnderstanding,
            Ability.TextualArticulation
        ])!;

        expect(stub.data.kind).toBe('recurrence');
        if (stub.data.kind !== 'recurrence') throw new Error('Expected a recurrence.');
        expect(stub.data.lawWitness?.law).toBe(propertyLaw);
        expect(stub.data.lawWitness?.result).toBeTypeOf('number');
        expect(stub.labels).toEqual(expect.arrayContaining([
            operation,
            law,
            Area.EmergentFeatureRecognition
        ]));
        expect(stub.labels).not.toContain(Ability.ProcedureUnderstanding);
        expect(stub.labels).not.toContain(Ability.TextualArticulation);
    });
});
