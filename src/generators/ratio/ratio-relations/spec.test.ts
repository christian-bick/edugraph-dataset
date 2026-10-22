import {Ability, Area, Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {setSeed} from '../../../lib/random.ts';
import {generateWithLabels} from '../../../lib/utils.ts';
import {RatioRelationsGenerator} from './generator.ts';
import {spec} from './spec.ts';

describe('ratio-relations capabilities', () => {
    it('generates the reviewed broad ratio-language target without a magnitude label', () => {
        const problem = generateWithLabels(new RatioRelationsGenerator(), [
            Area.RatioAntecedentInterpretation, Area.RatioConsequentInterpretation,
            Ability.Interpretation, Ability.TextualArticulation
        ])!;
        expect(problem.data.kind).toBe('ratio-relation');
        expect(problem.data.antecedent.value.numerator).toBeLessThan(100);
        expect(problem.data.consequent.value.numerator).toBeLessThan(100);
        expect(problem.labels).toEqual([]);
    });

    it.each([[Scope.NumbersSmaller20, 20], [Scope.NumbersSmaller100, 100]] as const)(
        'resolves the %s magnitude constraint', (label, max) => {
            setSeed(44);
            const problem = generateWithLabels(new RatioRelationsGenerator(), [label])!;
            expect(problem.labels).toContain(label);
            expect(problem.data.antecedent.value.numerator).toBeLessThan(max);
            expect(problem.data.consequent.value.numerator).toBeLessThan(max);
        }
    );

    it('owns ordered ratio mathematics without selecting a learner action', () => {
        expect(spec.generalLabels).toEqual([Area.RatioAntecedentInterpretation, Area.RatioConsequentInterpretation]);
        setSeed(18);
        const first = generateWithLabels(new RatioRelationsGenerator(), [Scope.NumbersSmaller20, Ability.Interpretation]);
        setSeed(18);
        expect(generateWithLabels(new RatioRelationsGenerator(), [Scope.NumbersSmaller20, Ability.TextualArticulation])).toEqual(first);
    });
});
