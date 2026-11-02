import {Ability, Area, Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {createGenerationSelectionReceipt, planCompatibility} from '../../../lib/compatibility.ts';
import {enumerateDependencyAuditSelections} from '../../../lib/label-dependency-audit.ts';
import {generatePlannedDraw, resolvePlannedConfigurations} from '../../../lib/planned-generation.ts';
import {getRandomState, setSeed} from '../../../lib/random.ts';
import {normalizeSchemaChoices} from '../../../lib/schema-choices.ts';
import {extractConfig, findSchemaFallbackContractIssues, generateWithLabels} from '../../../lib/utils.ts';
import {countingQuantitySchema} from '../counting-quantity-schema.ts';
import {groupingCountingProfiles} from '../canonical-counting-domains.ts';
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
    it('retains three truthful grouping profiles, every original parity alias and no inference', () => {
        expect(Object.keys(ParityGroupingGeneratorSchema)).toEqual(['parity', 'range']);
        expect(spec).not.toHaveProperty('inferredLabels');
        expect(findSchemaFallbackContractIssues(ParityGroupingGeneratorSchema)).toEqual([]);
        expect(ParityGroupingGeneratorSchema.parity[2]).toHaveLength(9);
        expect(spec.generalLabels).toEqual(expect.arrayContaining([Scope.IntegerNumbers, Area.NumerationWithIntegers]));
        expect(spec.generalLabels).not.toContain(Ability.ConceptClassification);
        for (const zero of zeroLabels) {
            expect(spec.generalLabels).not.toContain(zero);
            expect(countingQuantitySchema.parity[0]).not.toContain(zero);
        }
        for (const labels of ParityGroupingGeneratorSchema.parity[2]) {
            expect(labels.filter(label => zeroLabels.includes(label))).toHaveLength(1);
            expect(ParityGroupingGeneratorSchema.parity[1]([...labels])).toBeDefined();
        }
        expect(ParityGroupingGeneratorSchema.parity[1]([])).toBeUndefined();
    });
    it('resolves every explicit profile purely and filters singleton odd collections by range', () => {
        for (const labels of ParityGroupingGeneratorSchema.parity[2]) {
            for (const profile of groupingCountingProfiles) {
                setSeed('grouping-profile'); const state = getRandomState();
                const parity = ParityGroupingGeneratorSchema.parity[1]([...labels]);
                expect(getRandomState()).toBe(state);
                const request = [...labels, ...profile.labels];
                if (parity === 'singleton-odd' && profile.range.max !== 5) {
                    expect(() => extractConfig(ParityGroupingGeneratorSchema, request)).toThrow();
                    expect(plan(request).supported).toBe(false); continue;
                }
                const result = extractConfig(ParityGroupingGeneratorSchema, request);
                expect(result.config).toEqual({parity, range: profile.range});
                const continuation = getRandomState();
                setSeed('grouping-profile');
                expect(extractConfig(ParityGroupingGeneratorSchema, request)).toEqual(result);
                expect(getRandomState()).toBe(continuation);
            }
        }
    });
    it('rejects contradictory parity/zero combinations and positive range floors before generation', () => {
        for (const labels of [[Area.EvenDivisibility, Scope.OddNumbers],
            [Scope.EvenNumbers, Scope.NumbersWithoutZero], [Scope.OddNumbers, ...zeroLabels]]) {
            expect(() => extractConfig(ParityGroupingGeneratorSchema, [...labels, Scope.NumbersSmaller20])).toThrow();
            expect(plan([...labels, Scope.NumbersSmaller20]).supported).toBe(false);
        }
        for (const lower of [Scope.NumbersLarger5, Scope.NumbersLarger10]) {
            expect(plan([lower, Scope.NumbersSmaller20, Scope.EvenNumbers, Scope.NumbersWithZero]).supported).toBe(false);
        }
    });
    it('proves every canonical range, parity alias and zero choice in planned replay', () => {
        for (const alias of [[], ...countingQuantitySchema.parity[2]]) for (const profile of groupingCountingProfiles) {
            const result = plan([...alias, ...profile.labels]);
            expect(result.supported).toBe(true);
            if (!result.supported) throw new Error(result.reason);
            const variants = enumerateDependencyAuditSelections(result.plan);
            expect(variants.status).toBe('complete');
            const even = alias.some(label => label === Scope.EvenNumbers || label === Area.EvenDivisibility);
            const odd = alias.some(label => label === Scope.OddNumbers || label === Area.UnevenDivisibility);
            const expectedProfiles = new Set(even ? ['even'] : odd ? profile.range.max === 5
                ? ['singleton-odd', 'positive-odd'] : ['positive-odd']
                : profile.range.max === 5 ? ['even', 'singleton-odd', 'positive-odd'] : ['even', 'positive-odd']);
            const observed = new Set<string>();
            for (const selection of variants.selections) {
                const sampleKey = 'bounded-grouping#parity-grouping#proof#train#question#inst:0';
                const replay = {version: 1 as const, sampleKey, attempt: 1, seed: 7,
                    selection: createGenerationSelectionReceipt(result.plan, selection.choices)};
                const input = {generatorSchema: ParityGroupingGeneratorSchema, viewSchema: {}, plan: result.plan,
                    sampleKey, attempt: 1, seed: 7, replay};
                const resolved = resolvePlannedConfigurations(input);
                observed.add(String(resolved.generatorConfig.parity));
                const draw = generatePlannedDraw({...input, generator: new ParityGroupingGenerator()});
                expect(draw.stub).not.toBeNull();
                expect(draw.replay).toEqual(replay);
                expect(draw.labels.includes(Scope.NumbersWithZero)).toBe(hasZero(draw.stub!.data));
                expect(draw.labels.includes(Scope.NumbersWithoutZero)).toBe(!hasZero(draw.stub!.data));
                expect(draw.labels.filter(label => zeroLabels.includes(label))).toHaveLength(1);
                expect(generatePlannedDraw({...input, generator: new ParityGroupingGenerator()})).toEqual(draw);
            }
            expect(observed).toEqual(expectedProfiles);
        }
    });
    it('completes each direct odd alias only with feasible profiles while retaining its requested band', () => {
        for (const alias of countingQuantitySchema.parity[2].slice(3)) for (const profile of groupingCountingProfiles) {
            const observed = new Set<string>();
            for (let seed = 0; seed < 32; seed++) {
                setSeed(seed);
                const draw = generateWithLabels(new ParityGroupingGenerator(), [...alias, ...profile.labels])!;
                observed.add(draw.data.numObjects === 1 ? 'singleton-odd' : 'positive-odd');
                expect(draw.data.parity).toBe('odd');
                expect(draw.labels).toEqual(expect.arrayContaining([...alias, ...profile.labels]));
                expect(draw.labels.includes(Scope.NumbersWithZero)).toBe(hasZero(draw.data));
            }
            expect(observed).toEqual(new Set(profile.range.max === 5
                ? ['singleton-odd', 'positive-odd'] : ['positive-odd']));
        }
    });
});
