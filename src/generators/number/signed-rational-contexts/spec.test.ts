import {Ability, Area, Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {setSeed} from '../../../lib/random.ts';
import {findSchemaFallbackContractIssues, generateWithLabels} from '../../../lib/utils.ts';
import {SignedRationalContextsGenerator} from './generator.ts';
import {SignedRationalContextsGeneratorSchema, spec} from './spec.ts';

const zeroBundle = [Area.ZeroConcept, Scope.NumbersWithZero];
const signedBundle = [Area.SignNotation, Scope.NumbersWithNegatives];
const resolveRelation = SignedRationalContextsGeneratorSchema.relation[1];

describe('signed rational context capability ownership', () => {
    it('declares complete fallback conjunctions and resolves every fallback with the production audit', () => {
        expect(SignedRationalContextsGeneratorSchema.relation[2]).toEqual([zeroBundle, signedBundle]);
        expect(findSchemaFallbackContractIssues(SignedRationalContextsGeneratorSchema)).toEqual([]);
        const singletonFallbackSchema = {relation: [SignedRationalContextsGeneratorSchema.relation[0], resolveRelation] as const};
        expect(findSchemaFallbackContractIssues(singletonFallbackSchema)).toHaveLength(4);
    });

    it('keeps RationalNumbers invariant and correlates exact Area/numeric-domain bundles', () => {
        expect(spec.generalLabels).toEqual([Scope.RationalNumbers]);
        expect(resolveRelation(zeroBundle)).toBe('reference-zero');
        expect(resolveRelation(signedBundle)).toBe('directed-pair');
        expect(resolveRelation([])).toBeUndefined();
        expect(resolveRelation([Area.ZeroConcept])).toBeUndefined();
        expect(resolveRelation([Scope.NumbersWithNegatives])).toBeUndefined();
        expect(() => resolveRelation([...zeroBundle, ...signedBundle])).toThrow('Unsupported exact label combination');
        expect(() => resolveRelation([Area.ZeroConcept, Scope.NumbersWithNegatives])).toThrow('Unsupported exact label combination');
    });

    it.each([
        {bundle: zeroBundle, relation: 'reference-zero', abilities: [Ability.Interpretation, Ability.TextualArticulation]},
        {bundle: signedBundle, relation: 'directed-pair', abilities: [Ability.Interpretation]},
        {bundle: signedBundle, relation: 'directed-pair', abilities: [Ability.Formalization, Ability.TextualReception]}
    ] as const)('resolves the actual Grade6 conjunction $relation with $abilities', ({bundle, relation, abilities}) => {
        for (let seed = 0; seed < 25; seed++) {
            setSeed(seed);
            const problem = generateWithLabels(new SignedRationalContextsGenerator(), [...bundle, Scope.RationalNumbers, ...abilities])!;
            expect(problem.labels).toEqual([...bundle]);
            expect(problem.data.kind).toBe('signed-rational-contexts');
            if (relation === 'reference-zero') expect(problem.data.observations.map(({value}) => value.numerator)).toEqual([0]);
            else expect(problem.data.observations.map(({sign}) => sign).sort()).toEqual([-1, 1]);
        }
    });

    it('never chooses context or mathematical values from the learner Ability', () => {
        for (const bundle of [zeroBundle, signedBundle]) {
            setSeed(419);
            const interpretation = generateWithLabels(new SignedRationalContextsGenerator(), [...bundle, Scope.RationalNumbers, Ability.Interpretation]);
            setSeed(419);
            const formalization = generateWithLabels(new SignedRationalContextsGenerator(), [...bundle, Scope.RationalNumbers, Ability.Formalization, Ability.TextualReception]);
            expect(formalization).toEqual(interpretation);
        }
    });
});
