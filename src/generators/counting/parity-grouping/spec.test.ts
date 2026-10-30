import {Ability, Area, Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {createGenerationSelectionReceipt, planCompatibility} from '../../../lib/compatibility.ts';
import {enumerateDependencyAuditSelections} from '../../../lib/label-dependency-audit.ts';
import {resolveRangeFromLabels} from '../../../lib/ontology.ts';
import {generatePlannedDraw, resolvePlannedConfigurations} from '../../../lib/planned-generation.ts';
import {getRandomState, setSeed} from '../../../lib/random.ts';
import {normalizeSchemaChoices} from '../../../lib/schema-choices.ts';
import {extractConfig, findSchemaFallbackContractIssues, generateWithLabels} from '../../../lib/utils.ts';
import {countingQuantitySchema} from '../counting-quantity-schema.ts';
import {ParityGroupingGenerator} from './generator.ts';
import {ParityGroupingGeneratorSchema, spec} from './spec.ts';

const plan = (labels: readonly string[]) => planCompatibility({
    identity: {targetId: 'bounded-grouping', generatorId: spec.generatorId, viewId: 'proof'}, targetLabels: labels,
    generatorLabels: spec.generalLabels, viewLabels: [], generatorRules: spec.compatibility,
    fields: normalizeSchemaChoices(ParityGroupingGeneratorSchema, labels, 'generator')
});
const zeroLabels: readonly string[] = [Scope.NumbersWithZero, Scope.NumbersWithoutZero];
const hasZero = (data: {groupSize: number; remainder: number}) => data.groupSize === 0 || data.remainder === 0;

describe('parity-grouping declarations', () => {
    it.each([[Area.EvenDivisibility, Scope.EvenNumbers, 'even'],
        [Area.UnevenDivisibility, Scope.OddNumbers, 'odd']] as const)(
        'retains the canonical count context for %s', (area, scope, parity) => {
            const result = generateWithLabels(new ParityGroupingGenerator(), [area, scope, Scope.NumbersSmaller20])!;
            expect(result.data.parity).toBe(parity);
            expect(result.labels).toEqual(expect.arrayContaining([area, scope, Scope.NumbersSmaller20]));
            expect(result.labels.includes(Scope.NumbersWithZero)).toBe(hasZero(result.data));
            expect(result.labels.includes(Scope.NumbersWithoutZero)).toBe(!hasZero(result.data));
            expect(spec.generalLabels).toContain(Scope.IntegerNumbers);
            expect(spec.generalLabels).toContain(Area.NumerationWithIntegers);
            expect(spec.generalLabels).not.toContain(Ability.ConceptClassification);
        }
    );

    it('owns three complete finite profiles without changing shared counting declarations or adding inference', () => {
        expect(Object.keys(ParityGroupingGeneratorSchema)).toEqual(['parity', 'range']);
        expect(spec).not.toHaveProperty('inferredLabels');
        expect(findSchemaFallbackContractIssues(ParityGroupingGeneratorSchema)).toEqual([]);
        for (const zero of zeroLabels) {
            expect(spec.generalLabels).not.toContain(zero);
            expect(countingQuantitySchema.parity[0]).not.toContain(zero);
        }
        expect(ParityGroupingGeneratorSchema.parity[2]).toHaveLength(9);
        for (const labels of ParityGroupingGeneratorSchema.parity[2]) {
            expect(labels.filter(label => zeroLabels.includes(label))).toHaveLength(1);
        }
        expect(new Set(ParityGroupingGeneratorSchema.parity[2].map(labels =>
            ParityGroupingGeneratorSchema.parity[1]([...labels]))))
            .toEqual(new Set(['even', 'singleton-odd', 'positive-odd']));
        expect(ParityGroupingGeneratorSchema.parity[1]([])).toBeUndefined();
        for (const labels of countingQuantitySchema.parity[2].slice(3)) {
            expect(ParityGroupingGeneratorSchema.parity[1]([...labels])).toBeUndefined();
        }
    });

    it('preserves direct even configuration and entropy while completing every original even alias', () => {
        for (const labels of countingQuantitySchema.parity[2].slice(0, 3)) {
            setSeed(1234);
            const before = extractConfig(countingQuantitySchema, [...labels, Scope.NumbersSmaller20]);
            const continuation = getRandomState();
            setSeed(1234);
            const after = extractConfig(ParityGroupingGeneratorSchema, [...labels, Scope.NumbersSmaller20]);
            expect(after.config).toEqual(before.config);
            expect(getRandomState()).toBe(continuation);
            expect(after.resolvedLabels).toContain(Scope.NumbersWithZero);
            expect(after.resolvedLabels).not.toContain(Scope.NumbersWithoutZero);
        }
    });

    it('resolves profiles purely, completes aliases deterministically and rejects contradictory requests', () => {
        for (const labels of ParityGroupingGeneratorSchema.parity[2]) {
            setSeed('grouping-profile'); const state = getRandomState();
            const parity = ParityGroupingGeneratorSchema.parity[1]([...labels]);
            expect(getRandomState()).toBe(state);
            const resolved = extractConfig(ParityGroupingGeneratorSchema, [...labels, Scope.NumbersSmaller20]);
            expect(resolved.config.parity).toBe(parity);
            const continuation = getRandomState();
            setSeed('grouping-profile');
            expect(extractConfig(ParityGroupingGeneratorSchema, [...labels, Scope.NumbersSmaller20])).toEqual(resolved);
            expect(getRandomState()).toBe(continuation);
        }
        for (const labels of [[Area.EvenDivisibility, Scope.OddNumbers],
            [Scope.EvenNumbers, Scope.NumbersWithoutZero], [Scope.OddNumbers, ...zeroLabels]]) {
            expect(() => extractConfig(ParityGroupingGeneratorSchema, [...labels, Scope.NumbersSmaller20]))
                .toThrow(/Unsupported exact label combination/);
            expect(plan(labels).supported).toBe(false);
        }
    });

    it('has no unlabelled default and completes every odd alias with exactly two truthful planned outcomes', () => {
        for (const labels of [[], ...countingQuantitySchema.parity[2]]) {
            const result = plan([...labels, Scope.NumbersSmaller20]);
            expect(result.supported).toBe(true);
            if (!result.supported) throw new Error(result.reason);
            const selections = enumerateDependencyAuditSelections(result.plan);
            expect(selections.status).toBe('complete');
            const even = labels.some(label => label === Scope.EvenNumbers || label === Area.EvenDivisibility);
            const odd = labels.some(label => label === Scope.OddNumbers || label === Area.UnevenDivisibility);
            expect(selections.selections).toHaveLength(even ? labels.length === 2 ? 1 : 2
                : odd ? labels.length === 2 ? 2 : 4 : 9);
            const profiles = new Set<string>();
            for (const selection of selections.selections) {
                expect(selection.labels.filter(label => zeroLabels.includes(label))).toHaveLength(1);
                const sampleKey = 'bounded-grouping#parity-grouping#proof#train#question#inst:0';
                const replay = {version: 1 as const, sampleKey, attempt: 1, seed: 7,
                    selection: createGenerationSelectionReceipt(result.plan, selection.choices)};
                const input = {generatorSchema: ParityGroupingGeneratorSchema, viewSchema: {}, plan: result.plan,
                    sampleKey, attempt: 1, seed: 7, replay};
                const resolved = resolvePlannedConfigurations(input);
                profiles.add(String(resolved.generatorConfig.parity));
                const draw = generatePlannedDraw({...input, generator: new ParityGroupingGenerator()});
                expect(draw.stub).not.toBeNull();
                expect(draw.replay).toEqual(replay);
                expect(draw.labels.includes(Scope.NumbersWithZero)).toBe(hasZero(draw.stub!.data));
                expect(draw.labels.includes(Scope.NumbersWithoutZero)).toBe(!hasZero(draw.stub!.data));
                expect(generatePlannedDraw({...input, generator: new ParityGroupingGenerator()})).toEqual(draw);
            }
            expect(profiles).toEqual(new Set(even ? ['even'] : odd ? ['singleton-odd', 'positive-odd']
                : ['even', 'singleton-odd', 'positive-odd']));
        }
        const directProfiles = new Set<string>();
        for (let seed = 0; seed < 32; seed++) {
            setSeed(seed);
            const direct = generateWithLabels(new ParityGroupingGenerator(), [Scope.OddNumbers, Scope.NumbersSmaller20])!;
            directProfiles.add(direct.data.numObjects === 1 ? 'singleton-odd' : 'positive-odd');
            expect(direct.labels.includes(Scope.NumbersWithZero)).toBe(hasZero(direct.data));
        }
        expect(directProfiles).toEqual(new Set(['singleton-odd', 'positive-odd']));
    });

    it.each([
        [Scope.NumbersLarger10, Scope.NumbersSmaller20, Scope.EvenNumbers, Scope.NumbersWithZero, true],
        [Scope.NumbersLarger20, Scope.NumbersSmaller20, Scope.OddNumbers, Scope.NumbersWithoutZero, false],
        [Scope.NumbersLarger10, Scope.NumbersSmaller5, Scope.OddNumbers, Scope.NumbersWithoutZero, false],
        [Scope.NumbersLarger5, Scope.NumbersSmaller10, Scope.EvenNumbers, Scope.NumbersWithZero, true],
        [Scope.NumbersLarger5, Scope.NumbersSmaller20, Scope.OddNumbers, Scope.NumbersWithZero, false],
        [Scope.NumbersLarger100, Scope.NumbersSmaller1000, Scope.OddNumbers, Scope.NumbersWithoutZero, false]
    ] as const)('declares full range/profile feasibility before generation for %j', (lower, upper, parity, zero, supported) => {
        expect(plan([lower, upper, parity, zero]).supported).toBe(supported);
    });

    it('proves every bound, parity alias and zero combination against the complete finite mathematical domain', () => {
        const rule = spec.compatibility![0]!;
        const lower: (string | undefined)[] = [undefined, Scope.NumbersLargerZero, Scope.NumbersLarger5, Scope.NumbersLarger10,
            Scope.NumbersLarger20, Scope.NumbersLarger100, Scope.NumbersLarger120, Scope.NumbersLarger1000,
            Scope.NumbersLarger10000, Scope.NumbersLarger100000, Scope.NumbersLarger1000000];
        const upper: (string | undefined)[] = [undefined, Scope.NumbersSmaller5, Scope.NumbersSmaller10, Scope.NumbersSmaller20,
            Scope.NumbersSmaller100, Scope.NumbersSmaller120, Scope.NumbersSmaller1000, Scope.NumbersSmaller10000,
            Scope.NumbersSmaller100000, Scope.NumbersSmaller1000000];
        for (const min of lower) for (const max of upper) {
            const bounds = [min, max].filter((label): label is string => label !== undefined);
            const range = resolveRangeFromLabels(bounds);
            for (const parity of [[], ...countingQuantitySchema.parity[2], [Scope.EvenNumbers, Scope.OddNumbers],
                [Area.EvenDivisibility, Scope.OddNumbers], [Area.UnevenDivisibility, Scope.EvenNumbers]]) {
                for (const zero of [[], [Scope.NumbersWithZero], [Scope.NumbersWithoutZero], zeroLabels]) {
                    const selected = new Set<string>([...parity, ...zero]);
                    const even = selected.has(Area.EvenDivisibility) || selected.has(Scope.EvenNumbers);
                    const odd = selected.has(Area.UnevenDivisibility) || selected.has(Scope.OddNumbers);
                    const expected = even !== odd && zero.length === 1 && Array.from({length: 20}, (_, index) => index + 1)
                        .some(count => count >= range.min && count <= range.max && (even ? count % 2 === 0 : count % 2 === 1)
                            && (Math.floor(count / 2) === 0 || count % 2 === 0) === selected.has(Scope.NumbersWithZero));
                    const target = new Set(bounds);
                    expect(rule.predicate({exact: (scope, label) => scope === 'target' ? target.has(label) : selected.has(label),
                        has: (scope, label) => scope === 'target' ? target.has(label) : selected.has(label)})).toBe(expected);
                    bounds.forEach(label => selected.add(label));
                    expect(rule.predicate({exact: (_, label) => selected.has(label), has: (_, label) => selected.has(label)})).toBe(expected);
                }
            }
        }
    });
});
