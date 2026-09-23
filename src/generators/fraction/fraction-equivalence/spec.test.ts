import {Ability, Area, Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {generateWithLabels} from '../../../lib/utils.ts';
import {setSeed} from '../../../lib/random.ts';
import {FractionEquivalenceGenerator} from './generator.ts';
import {spec} from './spec.ts';

describe('proper-fraction capability', () => {
    it('guarantees proper equivalent fractions independently of requested labels', () => {
        expect(spec.generalLabels).toEqual(expect.arrayContaining([Area.FractionEquivalence, Scope.ProperFractions, Scope.EqualShares]));
        const cases: string[][] = [[], [Area.Multiplication], [Ability.ConceptClassification]];
        for (const labels of cases) {
            const result = generateWithLabels(new FractionEquivalenceGenerator(), labels)!;
            expect(result.data.task).toBe('relate-equivalent-fractions');
            expect(result.labels.includes(Area.Multiplication)).toBe(labels.includes(Area.Multiplication));
            expect(result.labels).not.toContain(Ability.ConceptClassification);
        }
    });
    it('does not change the mathematical draw when the requested Ability changes', () => {
        const generator = new FractionEquivalenceGenerator();
        setSeed('same-relation');
        const first = generateWithLabels(generator, [Area.Multiplication, Ability.ConceptClassification]);
        setSeed('same-relation');
        expect(generateWithLabels(generator, [Area.Multiplication, Ability.Formalization])!.data).toEqual(first!.data);
    });
});
