import {Area, Scope, deductCompatible} from 'edugraph-ts';
import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {afterAll, beforeAll, describe, expect, it, vi} from 'vitest';
import {hasCanonicalRangeWitness} from '../../lib/canonical-numeric-range.ts';
import {createGenerationSelectionReceipt} from '../../lib/compatibility.ts';
import {resolveDependencyAuditAnnotation} from '../../lib/label-dependency-annotation-resolution.ts';
import {enumerateDependencyAuditSelections} from '../../lib/label-dependency-audit.ts';
import {planModelCompatibility} from '../../lib/model-compatibility.ts';
import {resolveRangeFromLabels} from '../../lib/ontology.ts';
import {resolvePlannedConfigurations} from '../../lib/planned-generation.ts';
import * as rng from '../../lib/random.ts';
import {selectExactMatch} from '../../lib/resolvers.ts';
import {resolveSchemaChoices} from '../../lib/schema-choices.ts';
import {extractConfig, findSchemaFallbackContractIssues, extractSchemaLabels} from '../../lib/utils.ts';
import {matchTarget} from '../../lib/matching.ts';
import {spec as kindergarten} from '../../spec/ccss/kindergarten.ts';
import {spec as gradeOne} from '../../spec/ccss/grade-01.ts';
import {spec as gradeTwo} from '../../spec/ccss/grade-02.ts';
import {spec as gradeFour} from '../../spec/ccss/grade-04.ts';
import {spec as nameViewSpec} from '../../visuals/views/numbers/numbers-write-name/spec.ts';
import {spec as readingViewSpec} from '../../visuals/views/numbers/numbers-read-standard/spec.ts';
import {spec as standardViewSpec} from '../../visuals/views/numbers/numbers-write-standard/spec.ts';
import {spec as strokeViewSpec} from '../../visuals/views/numbers/numbers-write-stroke/spec.ts';
import {spec as countViewSpec} from '../../visuals/views/numbers/numbers-write-count/spec.ts';
import {spec as lineViewSpec} from '../../visuals/views/operations/operations-number-line-representation/spec.ts';
import {WritingGenerator} from './generator.ts';
import {nameIntegerInterval, nameRangeProfiles} from './range-profile.ts';
import {spec, WritingGeneratorSchema as schema, type WritingGeneratorConfig} from './spec.ts';
import {resolveWritingZero} from './zero-profile.ts';

let Name: typeof import('../../visuals/views/numbers/numbers-write-name/view.tsx')['NumbersWriteName'];
let Read: typeof import('../../visuals/views/numbers/numbers-read-standard/view.tsx')['NumbersReadStandard'];
beforeAll(async () => {
    vi.stubGlobal('window', {});
    ({NumbersWriteName: Name} = await import('../../visuals/views/numbers/numbers-write-name/view.tsx'));
    ({NumbersReadStandard: Read} = await import('../../visuals/views/numbers/numbers-read-standard/view.tsx'));
});
afterAll(() => vi.unstubAllGlobals());

const model = {generatorId: spec.generatorId, generalLabels: spec.generalLabels, schema, spec};
const oldSchema = {
    notationFamily: [[Area.DigitNotation, Area.NumerationWithIntegers, Area.NumberNameNotation], selectExactMatch],
    requireZero: [[Scope.NumbersWithZero, Scope.NumbersWithoutZero], resolveWritingZero, [[Scope.NumbersWithZero], [Scope.NumbersWithoutZero]]],
    range: [deductCompatible([Scope.NumbersLargerZero, Scope.NumbersSmaller1000000]), resolveRangeFromLabels]
} as const;
const oldSpec = {...spec, compatibility: [spec.compatibility![0]!]};
const allSources = [...kindergarten, ...gradeOne, ...gradeTwo, ...gradeFour];

describe('scalar name canonical profiles and legacy isolation', () => {
    it('preserves every nonthreshold scalar in the complete old inclusive1m corpus, plus the explicit zero competency', () => {
        const covered = new Uint8Array(1000001);
        let total = 0, failures = 0;
        for (const profile of nameRangeProfiles) {
            const [first, last] = nameIntegerInterval(profile.range, false);
            for (let number = first; number <= last; number++) {
                if (covered[number] || !hasCanonicalRangeWitness([number], profile.range)) failures++;
                covered[number] = 1;
                total++;
            }
        }
        const retired = [];
        for (let n = 1; n <= 1000000; n++) if (!covered[n]) retired.push(n);
        expect(failures).toBe(0);
        expect(total).toBe(999991);
        expect(retired).toEqual([5, 10, 20, 100, 120, 1000, 10000, 100000, 1000000]);
        expect(nameIntegerInterval(nameRangeProfiles[0]!.range, true)).toEqual([0, 0]);
    });

    it('resolves all nine positive profiles and scalar zero natively, with exact RNG boundaries, replay and both admitted Q/S consumers', () => {
        expect(findSchemaFallbackContractIssues(schema)).toEqual([]);
        const generator = new WritingGenerator();
        for (const profile of nameRangeProfiles) for (const zero of [false, true]) {
            if (zero && profile.range.max !== 5) continue;
            const zeroLabel = zero ? Scope.NumbersWithZero : Scope.NumbersWithoutZero;
            const labels = [Area.NumberNameNotation, zeroLabel, ...profile.labels];
            const direct = extractConfig(schema, labels), planned = resolveSchemaChoices(schema, labels,
                {notationFamily: [Area.NumberNameNotation], requireZero: [zeroLabel], range: profile.labels});
            expect(planned.config).toEqual(direct.config);
            expect(direct.config.range).toEqual(profile.range);
            const [first, last] = nameIntegerInterval(profile.range, zero);
            const draw = vi.spyOn(rng, 'random');
            try {
                for (const edge of [0, (2 ** 32 - 1) / 2 ** 32]) {
                    draw.mockClear().mockReturnValue(edge);
                    expect(generator.generate(direct.config)!.data.number).toBe(edge === 0 ? first : last);
                    expect(draw).toHaveBeenCalledTimes(zero ? 0 : 1);
                }
            } finally {draw.mockRestore();}
            rng.setSeed(profile.range.max);
            const result = generator.generate(direct.config), continuation = rng.getRandomState();
            rng.setSeed(profile.range.max);
            expect(generator.generate(planned.config)).toEqual(result);
            expect(rng.getRandomState()).toBe(continuation);
            for (const [View, view] of [[Name, nameViewSpec], [Read, readingViewSpec]] as const)
                for (const isSolutionView of [false, true]) {
                    const html = renderToStaticMarkup(createElement(View, {payload: {viewId: view.viewId, targetLabels: labels,
                        problem: {type: 'writing', data: result!.data, labels}, isSolutionView, seed: 0,
                        preparedView: {version: 1, viewId: view.viewId, config: {}, labels: [], randomState: 1, planHash: 'name-proof', variantHash: 'empty'}}}));
                    expect(html).not.toMatch(/NaN|undefined/);
                    expect(html).toMatch(/number|numeral|words/i);
                }
        }
    });

    it('covers all999991 positive names through nine actual source successors with exhaustive static inference', () => {
        const targets = allSources.filter(t => t.id.startsWith('2.NBT.A.3-number-names~') || t.id.startsWith('4.NBT.A.2-write-number-names~'));
        expect(targets).toHaveLength(9);
        let values = 0, selections = 0;
        const intervals: string[] = [];
        for (const target of targets) {
            const matched = planModelCompatibility(target, model, {viewId: nameViewSpec.viewId, generalLabels: nameViewSpec.generalLabels, schema: {}, spec: nameViewSpec});
            if (!matched.supported) throw Error('A name source lost coverage');
            for (const selection of enumerateDependencyAuditSelections(matched.plan).selections) {
                expect(resolveDependencyAuditAnnotation({id: selection.variantHash, plan: matched.plan, selection,
                    generator: {schema, spec}, view: {schema: {}, spec: nameViewSpec}}).annotationResolution.status).toBe('exhaustive');
                const sampleKey = `${target.id}#writing#numbers-write-name#train#question#inst:0`;
                const resolved = resolvePlannedConfigurations({generatorSchema: schema, viewSchema: {}, generatorSpec: spec, viewSpec: nameViewSpec,
                    plan: matched.plan, sampleKey, seed: 0, attempt: 1, replay: {version: 1, sampleKey, seed: 0, attempt: 1,
                        selection: createGenerationSelectionReceipt(matched.plan, selection.choices)}});
                const config = resolved.generatorConfig as WritingGeneratorConfig;
                expect(config.requireZero).toBe(false);
                const [first, last] = nameIntegerInterval(config.range!, false);
                intervals.push(`${first}:${last}`);
                values += last - first + 1;
                selections++;
            }
        }
        expect(selections).toBe(9);
        expect(new Set(intervals).size).toBe(9);
        expect(values).toBe(999991);
    });

    it('replays2700 positive name draws and their exact PRNG continuation across all scalar bands', () => {
        const generator = new WritingGenerator();
        for (const profile of nameRangeProfiles) for (let seed = 0; seed < 300; seed++) {
            const config = {notationFamily: Area.NumberNameNotation, range: profile.range, requireZero: false};
            rng.setSeed(seed);
            const first = generator.generate(config)!, state = rng.getRandomState();
            expect(hasCanonicalRangeWitness([first.data.number], profile.range)).toBe(true);
            rng.setSeed(seed);
            expect(generator.generate(config)).toEqual(first);
            expect(rng.getRandomState()).toBe(state);
        }
    });

    it('leaves every old non-name source binding, resolved config, same-seed payload and random continuation identical', () => {
        let routes = 0;
        for (const target of allSources.filter(t => !t.labels.includes(Area.NumberNameNotation)))
            for (const view of [readingViewSpec, standardViewSpec, strokeViewSpec, countViewSpec]) {
                const previous = planModelCompatibility(target, {generatorId: spec.generatorId, generalLabels: spec.generalLabels, schema: oldSchema, spec: oldSpec},
                    {viewId: view.viewId, generalLabels: view.generalLabels, schema: {}, spec: view});
                if (!previous.supported) continue;
                const current = planModelCompatibility(target, model, {viewId: view.viewId, generalLabels: view.generalLabels, schema: {}, spec: view});
                expect(current.supported).toBe(true);
                if (!current.supported) throw Error('An untouched writing source lost coverage');
                for (const selection of enumerateDependencyAuditSelections(current.plan).selections)
                    expect(resolveDependencyAuditAnnotation({id: selection.variantHash, plan: current.plan, selection,
                        generator: {schema, spec}, view: {schema: {}, spec: view}}).annotationResolution.status).toBe('exhaustive');
                expect(enumerateDependencyAuditSelections(current.plan).selections.map(s => s.labels))
                    .toEqual(enumerateDependencyAuditSelections(previous.plan).selections.map(s => s.labels));
                for (const seed of [0, 17, 2026, 105]) {
                    const outcomes = [oldSchema, schema].map(owner => {
                        rng.setSeed(seed);
                        const resolved = extractConfig(owner, target.labels);
                        const state = rng.getRandomState();
                        const output = new WritingGenerator().generate(resolved.config);
                        return {resolved, state, output, continuation: rng.getRandomState()};
                    });
                    expect(outcomes[1]).toEqual(outcomes[0]);
                }
                routes++;
            }
        expect(routes).toBe(17);
    });

    it('uses the existing typed number-line boundary rather than adding a range-specific guard', () => {
        const result = matchTarget({id: 'name-on-line', labels: [Area.NumberNameNotation, Scope.Numberline, Scope.NumbersSmaller10]},
            {...model, labels: [...spec.generalLabels, ...extractSchemaLabels(schema)], problemType: 'WritingProblem'},
            {viewId: lineViewSpec.viewId, generalLabels: lineViewSpec.generalLabels, schema: {}, spec: lineViewSpec,
                supportedLabels: [...lineViewSpec.generalLabels], problemType: 'WholeNumberLengthProblem'});
        expect(result).toEqual({matched: false, reason: 'incompatible-type'});
        for (const view of [standardViewSpec, strokeViewSpec, countViewSpec])
            expect(planModelCompatibility({id: 'wrong-name-task', labels: [Area.NumberNameNotation, Scope.NumbersSmaller10,
                ...(view.viewId === countViewSpec.viewId ? [Area.NumerationWithIntegers] : [Area.DigitNotation])]}, model,
            {viewId: view.viewId, generalLabels: view.generalLabels, schema: {}, spec: view}).supported).toBe(false);
    });

    it('rejects malformed or zero-incompatible canonical scalar configurations', () => {
        const base = nameRangeProfiles[1]!.range;
        expect(() => nameIntegerInterval({min: 0, max: 10}, false)).toThrow();
        expect(() => nameIntegerInterval({...base, maximumAbove: 0}, false)).toThrow();
        expect(() => nameIntegerInterval({...base, minimumBelow: 100}, false)).toThrow();
        expect(() => nameIntegerInterval(base, true)).toThrow();
    });
});
