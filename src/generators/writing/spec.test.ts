import {describe, expect, it} from 'vitest';
import {Ability, Area, Scope} from 'edugraph-ts';
import {getRandomState, setSeed} from '../../lib/random.ts';
import {extractConfig, generateWithLabels} from '../../lib/utils.ts';
import {planModelCompatibility} from '../../lib/model-compatibility.ts';
import {generatePlannedDraw, resolvePlannedConfigurations} from '../../lib/planned-generation.ts';
import {resolveInferredLabels} from '../../lib/inferred-labels.ts';
import {spec as numberLineSpec} from '../../visuals/views/operations/operations-number-line-representation/spec.ts';
import {spec as readingSpec} from '../../visuals/views/numbers/numbers-read-standard/spec.ts';
import {WritingGeneratorSchema, spec} from './spec.ts';
import {WritingGenerator} from './generator.ts';

describe('WritingGenerator Spec Integration', () => {
    const generator = new WritingGenerator();
    const model = {generatorId: spec.generatorId, generalLabels: spec.generalLabels,
        schema: WritingGeneratorSchema, spec};

    it.each([Scope.NumbersSmaller120, Scope.NumbersSmaller1000])(
        'adds zero absence throughout the bounded positive legacy %s configuration', maximum => {
            for (let seed = 0; seed < 24; seed++) {
                setSeed(seed);
                const stub = generateWithLabels(generator, [Area.DigitNotation, maximum]);
                expect(stub).not.toBeNull();
                expect(stub!.data.number).toBeGreaterThan(0);
                expect(stub!.data.number).toBeLessThanOrEqual(1000);
                expect(stub!.data).not.toHaveProperty('placeValues');
                expect(stub!.labels).toContain(Scope.NumbersWithoutZero);
                expect(stub!.labels).not.toContain(Scope.NumbersWithZero);
            }
        }
    );

    it('keeps both branch boundaries and explicit zero outside the added claim', () => {
        const base = {notationFamily: Area.DigitNotation, requireZero: false};
        for (const maximum of [100, 1001, 1000000]) {
            expect(resolveInferredLabels({spec, schema: WritingGeneratorSchema,
                config: {...base, range: {min: 0, max: maximum}}, labels: [], owner: 'generator'})).toEqual([]);
        }
        for (const maximum of [101, 1000]) {
            expect(resolveInferredLabels({spec, schema: WritingGeneratorSchema,
                config: {...base, range: {min: 0, max: maximum}}, labels: [], owner: 'generator'}))
                .toEqual([Scope.NumbersWithoutZero]);
        }
        const zero = generateWithLabels(generator,
            [Area.DigitNotation, Scope.NumbersWithZero, Scope.NumbersSmaller1000]);
        expect(zero!.data.number).toBe(0);
        expect(zero!.labels).not.toContain(Scope.NumbersWithoutZero);
        const existing = generateWithLabels(generator,
            [Area.DigitNotation, Scope.NumbersWithoutZero, Scope.NumbersSmaller1000]);
        expect(existing!.labels.filter(label => label === Scope.NumbersWithoutZero)).toHaveLength(1);
    });

    it('excludes the number-line origin even when a target also requests Arabic numerals and a broader bound', () => {
        const consumer = {viewId: numberLineSpec.viewId, generalLabels: numberLineSpec.generalLabels,
            schema: {}, spec: numberLineSpec};
        const common = [Area.DigitNotation, Scope.Numberline, Scope.ArabicNumerals, Ability.VisualArticulation];
        expect(planModelCompatibility({id: 'unbounded-line',
            labels: [...common, Scope.NumbersSmaller120]}, model, consumer).supported).toBe(false);
        expect(planModelCompatibility({id: 'mixed-bounds-line',
            labels: [...common, Scope.NumbersSmaller100, Scope.NumbersSmaller120]}, model, consumer).supported).toBe(false);
        for (const bounds of [[Scope.NumbersSmaller100], [Scope.NumbersSmaller100, Scope.NumbersSmaller20]]) {
            const target = {id: 'bounded-line', labels: [...common, ...bounds]};
            const result = planModelCompatibility(target, model, consumer);
            expect(result.supported).toBe(true);
            if (!result.supported) throw new Error('Expected the existing bounded line to remain admitted.');
            const resolved = resolvePlannedConfigurations({generatorSchema: WritingGeneratorSchema,
                generatorSpec: spec, viewSchema: {}, viewSpec: numberLineSpec, plan: result.plan,
                sampleKey: 'bounded-line#writing#operations-number-line-representation#train#question#inst:0',
                attempt: 1, seed: 17});
            expect(resolved.generatorConfig).toHaveProperty('range.max', bounds.length === 1 ? 100 : 20);
            expect(resolved.labels).not.toContain(Scope.NumbersWithoutZero);
        }
    });

    it('preserves complete direct configurations, payloads and random continuation', () => {
        const oldSpec = {...spec, inferredLabels: undefined};
        for (const notation of [[], [Area.DigitNotation], [Area.NumerationWithIntegers], [Area.NumberNameNotation]]) {
            for (const maximum of [Scope.NumbersSmaller100, Scope.NumbersSmaller120,
                Scope.NumbersSmaller1000, Scope.NumbersSmaller1000000]) {
                for (const zero of [[], [Scope.NumbersWithZero], [Scope.NumbersWithoutZero]]) {
                    const labels = [...notation, maximum, ...zero];
                    for (const seed of [0, 17, 2026]) {
                        const draws = [oldSpec, spec].map(owner => {
                            setSeed(seed);
                            const resolved = extractConfig(generator.schema, labels, {spec: owner, owner: 'generator'});
                            const configState = getRandomState();
                            return {...resolved, configState, stub: generator.generate(resolved.config), state: getRandomState()};
                        });
                        const expected = draws[0];
                        const additional = !expected.config.requireZero && expected.config.range!.max > 100
                            && expected.config.range!.max <= 1000 ? [Scope.NumbersWithoutZero] : [];
                        expect(draws[1]).toEqual({...expected,
                            resolvedLabels: [...new Set([...expected.resolvedLabels, ...additional])]});
                    }
                }
            }
        }
    });

    it('preserves planned draws and recomputes the additional annotation on replay', () => {
        const target = {id: 'read-legacy', labels: [Area.DigitNotation, Scope.NumbersSmaller1000,
            Scope.ArabicNumerals, Ability.TextualReception]};
        const result = planModelCompatibility(target, model, {viewId: readingSpec.viewId,
            generalLabels: readingSpec.generalLabels, schema: {}, spec: readingSpec});
        expect(result.supported).toBe(true);
        if (!result.supported) throw new Error('Expected legacy reading to remain admitted.');
        const input = {generator, viewSchema: {}, viewSpec: readingSpec, plan: result.plan,
            sampleKey: 'read-legacy#writing#numbers-read-standard#train#question#inst:0', attempt: 1, seed: 42};
        const old = generatePlannedDraw({...input, generatorSpec: {...spec, inferredLabels: undefined}});
        const oldState = getRandomState();
        const current = generatePlannedDraw(input);
        expect(current.stub!.data).toEqual(old.stub!.data);
        expect(current.view).toEqual(old.view);
        expect(current.replay).toEqual(old.replay);
        expect(getRandomState()).toBe(oldState);
        expect(current.labels).toEqual([...new Set([...old.labels, Scope.NumbersWithoutZero])].sort());
        expect(generatePlannedDraw({...input, replay: current.replay})).toEqual(current);
    });

    it('should resolve NumbersWithZero into a zero numeral every time', () => {
        for (let seed = 0; seed < 20; seed++) {
            setSeed(seed);
            const stub = generateWithLabels(generator, [
                Area.DigitNotation,
                Scope.NumbersWithZero,
                Scope.NumbersSmaller20
            ]);
            expect(stub).not.toBeNull();
            expect(stub!.data.number).toBe(0);
            expect(stub!.labels).toContain(Scope.NumbersWithZero);
        }
    });

    it('should resolve NumbersWithoutZero into a nonzero numeral every time', () => {
        for (let seed = 0; seed < 20; seed++) {
            setSeed(seed);
            const stub = generateWithLabels(generator, [
                Area.DigitNotation,
                Scope.NumbersWithoutZero,
                Scope.NumbersSmaller20
            ]);
            expect(stub).not.toBeNull();
            expect(stub!.data.number).toBeGreaterThanOrEqual(1);
            expect(stub!.data.number).toBeLessThanOrEqual(20);
            expect(stub!.labels).toContain(Scope.NumbersWithoutZero);
        }
    });

    it('should resolve the inclusive NumbersSmaller120 boundary', () => {
        for (let seed = 0; seed < 50; seed++) {
            setSeed(seed);
            const stub = generateWithLabels(generator, [
                Area.DigitNotation,
                Scope.NumbersWithoutZero,
                Scope.NumbersSmaller120
            ]);
            expect(stub).not.toBeNull();
            expect(stub!.data.number).toBeGreaterThanOrEqual(1);
            expect(stub!.data.number).toBeLessThanOrEqual(120);
            expect(stub!.labels).toContain(Scope.NumbersSmaller120);
        }
    });

    it('should resolve the inclusive NumbersSmaller1000 boundary', () => {
        for (let seed = 0; seed < 50; seed++) {
            setSeed(seed);
            const stub = generateWithLabels(generator, [
                Area.DigitNotation,
                Scope.NumbersWithoutZero,
                Scope.NumbersSmaller1000
            ]);
            expect(stub).not.toBeNull();
            expect(stub!.data.number).toBeGreaterThanOrEqual(1);
            expect(stub!.data.number).toBeLessThanOrEqual(1000);
            expect(stub!.labels).toContain(Scope.NumbersSmaller1000);
        }
    });

    it.each([
        Area.DigitNotation,
        Area.NumberNameNotation
    ] as const)('resolves Grade 4 %s through one million', notationFamily => {
        setSeed(404);
        const stub = generateWithLabels(generator, [
            notationFamily,
            Scope.Base10,
            Scope.NumbersLarger1000,
            Scope.NumbersSmaller1000000
        ]);

        expect(stub).not.toBeNull();
        expect('placeValues' in stub!.data && stub!.data.placeValues.length).toBeGreaterThanOrEqual(4);
        expect(stub!.data.number).toBeGreaterThanOrEqual(1000);
        expect(stub!.data.number).toBeLessThanOrEqual(1_000_000);
        expect(stub!.labels).toEqual(expect.arrayContaining([
            notationFamily,
            Scope.NumbersLarger1000,
            Scope.NumbersSmaller1000000
        ]));
    });
});
