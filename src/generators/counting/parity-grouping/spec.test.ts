import {Ability, Area, Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {extractConfig, generateWithLabels} from '../../../lib/utils.ts';
import {normalizeSchemaChoices} from '../../../lib/schema-choices.ts';
import {planCompatibility} from '../../../lib/compatibility.ts';
import {ParityGroupingGenerator} from './generator.ts';
import {ParityGroupingGeneratorSchema, spec} from './spec.ts';

describe('parity-grouping declarations', () => {
    it.each([[Area.EvenDivisibility, Scope.EvenNumbers, 'even'],
        [Area.UnevenDivisibility, Scope.OddNumbers, 'odd']] as const)(
        'retains the canonical count context for %s', (area, scope, parity) => {
            const result = generateWithLabels(new ParityGroupingGenerator(), [area, scope, Scope.NumbersSmaller20])!;
            expect(result.data.parity).toBe(parity);
            expect(result.labels).toEqual(expect.arrayContaining([area, scope, Scope.NumbersSmaller20]));
            expect(spec.generalLabels).toContain(Scope.IntegerNumbers);
            expect(spec.generalLabels).toContain(Area.NumerationWithIntegers);
            expect(spec.generalLabels).not.toContain(Ability.ConceptClassification);
        }
    );

    it('does not introduce a zero label, selector or inference policy in the structural migration', () => {
        expect(Object.keys(ParityGroupingGeneratorSchema)).toEqual(['parity', 'range']);
        expect(spec).not.toHaveProperty('inferredLabels');
        for (const zero of [Scope.NumbersWithZero, Scope.NumbersWithoutZero]) {
            expect(spec.generalLabels).not.toContain(zero);
            expect(Object.values(ParityGroupingGeneratorSchema).flatMap(value => value[0])).not.toContain(zero);
        }
    });

    it('rejects conflicting parity requests and preserves unqualified scalar resolution', () => {
        expect(() => extractConfig(ParityGroupingGeneratorSchema,
            [Area.EvenDivisibility, Scope.OddNumbers, Scope.NumbersSmaller20])).toThrow(/both even and odd/);
        expect(extractConfig(ParityGroupingGeneratorSchema, [Scope.NumbersSmaller20]).config.parity).toBe('any');
    });

    it.each([
        [Scope.NumbersLarger10, Scope.NumbersSmaller20, Scope.EvenNumbers, true],
        [Scope.NumbersLarger20, Scope.NumbersSmaller20, Scope.OddNumbers, false],
        [Scope.NumbersLarger10, Scope.NumbersSmaller5, Scope.OddNumbers, false],
        [Scope.NumbersLarger5, Scope.NumbersSmaller10, Scope.EvenNumbers, true]
    ] as const)('declares numeric parity feasibility before generation for %j', (lower, upper, parity, supported) => {
        const labels = [lower, upper, parity];
        const result = planCompatibility({identity: {targetId: 'bounded-grouping', generatorId: spec.generatorId, viewId: 'proof'},
            targetLabels: labels, generatorLabels: spec.generalLabels, viewLabels: [], generatorRules: spec.compatibility,
            fields: normalizeSchemaChoices(ParityGroupingGeneratorSchema, labels, 'generator')});
        expect(result.supported).toBe(supported);
    });

    it('proves the local feasibility predicate against the complete finite collection domain', () => {
        const rule = spec.compatibility![0]!;
        const lowerBounds = [[undefined, 1], [Scope.NumbersLarger5, 5],
            [Scope.NumbersLarger10, 10], [Scope.NumbersLarger20, 20]] as const;
        const upperBounds = [[Scope.NumbersSmaller5, 5], [Scope.NumbersSmaller10, 10],
            [Scope.NumbersSmaller20, 20]] as const;
        for (const [lower, minimum] of lowerBounds) for (const [upper, maximum] of upperBounds) {
            for (const parity of [[], [Area.EvenDivisibility], [Scope.EvenNumbers],
                [Area.UnevenDivisibility], [Scope.OddNumbers], [Scope.EvenNumbers, Scope.OddNumbers]]) {
                const selected = new Set<string>([...(lower ? [lower] : []), upper, ...parity]);
                const expected = Array.from({length: 20}, (_, index) => index + 1).some(count =>
                    count >= minimum && count <= maximum
                    && (!parity.some(label => label === Area.EvenDivisibility || label === Scope.EvenNumbers) || count % 2 === 0)
                    && (!parity.some(label => label === Area.UnevenDivisibility || label === Scope.OddNumbers) || count % 2 === 1));
                expect(rule.predicate({exact: (_, label) => selected.has(label), has: (_, label) => selected.has(label)})).toBe(expected);
            }
        }
    });
});
