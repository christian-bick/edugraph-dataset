import {Ability, Area, Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {setSeed} from '../../../lib/random.ts';
import {generateWithLabels} from '../../../lib/utils.ts';
import {ArithmeticPatternsGenerator} from './generator.ts';
import {spec} from './spec.ts';

describe('ArithmeticPatternsGenerator spec integration', () => {
    const generator = new ArithmeticPatternsGenerator();

    it('declares one canonical model capable of supporting each pattern focus', () => {
        expect(spec.generalLabels).toEqual(expect.arrayContaining([
            Area.PatternGeneration,
            Area.GenerativeRuleRecognition,
            Area.EmergentFeatureRecognition,
            Scope.IntegerNumbers,
            Scope.Base10,
            Scope.NumbersWithoutNegatives
        ]));
        expect(generator.schema).not.toHaveProperty('task');
    });

    it.each([
        Area.PatternGeneration,
        Area.GenerativeRuleRecognition,
        Area.EmergentFeatureRecognition
    ] as const)('keeps %s in the target labels without selecting a learner task', patternArea => {
        setSeed(17);
        const stub = generateWithLabels(generator, [
            Area.Addition,
            patternArea,
            Ability.ProcedureExecution
        ])!;

        expect(stub.data).not.toHaveProperty('task');
        expect(stub.data.ruleText).toBeTruthy();
        expect(stub.data.terms.length).toBeGreaterThanOrEqual(4);
        expect(stub.data.inferredFeature).toBeTruthy();
        expect(stub.tags).toContain(Area.Addition);
        expect(stub.tags).not.toContain(patternArea);
        expect(stub.tags).not.toContain(Ability.ProcedureExecution);
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

        expect(stub.data.propertyLaw).toBe(propertyLaw);
        expect(stub.data.leftExpression).toBeTruthy();
        expect(stub.data.rightExpression).toBeTruthy();
        expect(stub.tags).toEqual(expect.arrayContaining([operation, law]));
        expect(stub.tags).not.toContain(Ability.ProcedureUnderstanding);
        expect(stub.tags).not.toContain(Ability.TextualArticulation);
    });
});
