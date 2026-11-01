import {Ability, Area, Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {findSchemaFallbackContractIssues, generateWithLabels} from '../../../lib/utils.ts';
import {normalizeSchemaChoices, resolveSchemaChoices} from '../../../lib/schema-choices.ts';
import {getRandomState, setSeed, withoutRandomness} from '../../../lib/random.ts';
import {hasCanonicalRangeWitness} from '../../../lib/canonical-numeric-range.ts';
import {EqualGroupsCollectionGenerator} from './generator.ts';
import {EqualGroupsCollectionGeneratorSchema as schema, spec} from './spec.ts';
import {equalGroupsRangeProfiles, equalGroupsRangeLabels} from './range-profile.ts';

describe('EqualGroupsCollectionGenerator spec integration', () => {
    const generator = new EqualGroupsCollectionGenerator();

    it.each([
        [Area.Multiplication, 'multiplication'],
        [Area.PartitiveDivision, 'partitive-division'],
        [Area.QuotativeDivision, 'quotative-division']
    ] as const)('resolves %s interpretation targets', (area, operation) => {
        const stub = generateWithLabels(generator, [
            area,
            Scope.EqualShares,
            Scope.PhysicalNumbers,
            Scope.NumbersSmaller100,
            Ability.Interpretation
        ]);
        expect(stub).not.toBeNull();
        expect(stub!.data.operation).toBe(operation);
        expect(stub!.labels).toContain(area);
    });

    it('declares five nonempty profiles, with upper100 optional strongest lower5', () => {
        expect(spec.generalLabels).not.toContain(Scope.NumbersSmaller100);
        expect(equalGroupsRangeLabels).not.toContain(Scope.NumbersLargerZero);
        expect(equalGroupsRangeProfiles.map(({range}) => [range.min, range.max]))
            .toEqual([[0, 5], [0, 10], [0, 20], [0, 100], [5, 100]]);
        expect(findSchemaFallbackContractIssues(schema)).toEqual([]);
        const [domain] = normalizeSchemaChoices({range: schema.range}, [Scope.NumbersSmaller100], 'generator');
        expect(domain.alternatives.map(choice => choice.labels)).toEqual(expect.arrayContaining([
            [Scope.NumbersSmaller100], [Scope.NumbersLarger5, Scope.NumbersSmaller100].sort()
        ]));
        expect(domain.alternatives).toHaveLength(2);
        const [all] = normalizeSchemaChoices({range: schema.range}, [], 'generator');
        expect(all.alternatives).toHaveLength(5);
    });

    it('resolves every supported operation/profile deterministically before generation', () => {
        for (const operation of [Area.Multiplication, Area.PartitiveDivision, Area.QuotativeDivision]) {
            for (const {labels, range} of equalGroupsRangeProfiles) {
                setSeed(`${operation}-${labels.join('|')}`);
                const state = getRandomState();
                const resolved = withoutRandomness(() => resolveSchemaChoices(schema, [operation, ...labels], {
                    operation: [operation], range: labels
                }));
                expect(getRandomState()).toBe(state);
                expect(resolved.config.range).toEqual(range);
                const {data} = generator.generate(resolved.config);
                expect(hasCanonicalRangeWitness([data.groupCount, data.groupSize, data.total, data.answer], range)).toBe(true);
                const direct = generateWithLabels(generator, [operation, ...labels]);
                expect(direct!.labels).toEqual(expect.arrayContaining(labels));
                expect(hasCanonicalRangeWitness([direct!.data.groupCount, direct!.data.groupSize, direct!.data.total], range)).toBe(true);
            }
        }
    });
});
