import {Ability, Area, Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {setSeed} from '../../../lib/random.ts';
import {generateWithLabels} from '../../../lib/utils.ts';
import {ArithmeticPatternsGenerator} from './generator.ts';
import {spec} from './spec.ts';

describe('ArithmeticPatternsGenerator spec integration', () => {
    const generator = new ArithmeticPatternsGenerator();

    it('declares the invariant integer pattern capabilities', () => {
        expect(spec.generalLabels).toEqual(expect.arrayContaining([
            Scope.IntegerNumbers,
            Scope.Base10,
            Scope.NumbersWithoutNegatives
        ]));
        expect(spec.generalLabels).not.toContain(Area.PatternRecognition);
    });

    it.each([
        [Area.Addition, 'generate'],
        [Area.Multiplication, 'generate']
    ] as const)('resolves %s pattern generation', (operation, task) => {
        const labels = [operation, Area.PatternGeneration, Ability.ProcedureExecution];
        setSeed(17);
        const stub = generateWithLabels(generator, labels)!;

        expect(stub.data.task).toBe(task);
        expect(stub.tags).toEqual(expect.arrayContaining(labels));
    });

    it('resolves generative-rule recognition to the Grade 3 table payload', () => {
        const labels = [
            Area.Addition,
            Area.GenerativeRuleRecognition,
            Ability.ConceptClassification
        ];
        setSeed(19);
        const stub = generateWithLabels(generator, labels)!;

        expect(stub.data.task).toBeUndefined();
        expect(stub.data.patternAnswer).toBe(`Increase by ${stub.data.patternStep}`);
        expect(stub.tags).toContain(Area.Addition);
        expect(stub.tags).toContain(Area.GenerativeRuleRecognition);
        expect(stub.tags).not.toContain(Ability.ConceptClassification);
    });

    it.each([
        [Area.Addition, 'identify-feature'],
        [Area.Multiplication, 'identify-feature']
    ] as const)(
        'prioritizes %s classification over the accompanying procedure label',
        (operation, task) => {
            const labels = [
                operation,
                Area.EmergentFeatureRecognition,
                Ability.ProcedureExecution,
                Ability.ConceptClassification
            ];
            setSeed(23);
            const stub = generateWithLabels(generator, labels)!;

            expect(stub.data.task).toBe(task);
            expect(stub.tags).toEqual(expect.arrayContaining([
                operation,
                Ability.ProcedureExecution
            ]));
            expect(stub.tags).not.toContain(Ability.ConceptClassification);
        }
    );

    it.each([
        [Area.Addition, Area.CommutativeLaw, 'commutative'],
        [Area.Addition, Area.AssociativeLaw, 'associative'],
        [Area.Multiplication, Area.CommutativeLaw, 'commutative'],
        [Area.Multiplication, Area.AssociativeLaw, 'associative'],
        [Area.Multiplication, Area.DistributiveLaw, 'distributive']
    ] as const)(
        'keeps Grade 3 %s with %s on the legacy explanation payload',
        (operation, law, propertyLaw) => {
            const labels = [
                operation,
                law,
                Area.EmergentFeatureRecognition,
                Ability.ProcedureUnderstanding,
                Ability.TextualArticulation
            ];
            setSeed(29);
            const stub = generateWithLabels(generator, labels)!;

            expect(stub.data.task).toBeUndefined();
            expect(stub.data.propertyLaw).toBe(propertyLaw);
            expect(stub.tags).toEqual(expect.arrayContaining([operation, law]));
            expect(stub.tags).toContain(Area.EmergentFeatureRecognition);
            expect(stub.tags).not.toContain(Ability.ProcedureExecution);
        }
    );

    it.each([
        [Area.Addition, Area.CommutativeLaw, 'commutative'],
        [Area.Addition, Area.AssociativeLaw, 'associative'],
        [Area.Multiplication, Area.CommutativeLaw, 'commutative'],
        [Area.Multiplication, Area.AssociativeLaw, 'associative'],
        [Area.Multiplication, Area.DistributiveLaw, 'distributive']
    ] as const)('resolves %s with %s into a causal explanation', (operation, law, propertyLaw) => {
        const labels = [
            operation,
            law,
            Area.PatternGeneration,
            Area.EmergentFeatureRecognition,
            Ability.ProcedureExecution,
            Ability.ProcedureUnderstanding,
            Ability.TextualArticulation
        ];
        setSeed(31);
        const stub = generateWithLabels(generator, labels)!;

        expect(stub.data.task).toBe('explain-feature');
        if (stub.data.task !== 'explain-feature') throw new Error('Unexpected task');
        expect(stub.data.propertyLaw).toBe(propertyLaw);
        expect(stub.tags).toEqual(expect.arrayContaining([
            operation,
            law,
            Ability.ProcedureExecution
        ]));
        expect(stub.tags).not.toContain(Ability.ProcedureUnderstanding);
        expect(stub.tags).not.toContain(Ability.TextualArticulation);
    });
});
