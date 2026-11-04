import {describe, expect, it} from 'vitest';
import {Ability, Area, Scope} from 'edugraph-ts';
import {getRandomState, setSeed} from '../../lib/random.ts';
import {extractConfig, extractSchemaLabels, generateWithLabels} from '../../lib/utils.ts';
import {matchTarget} from '../../lib/matching.ts';
import {planModelCompatibility} from '../../lib/model-compatibility.ts';
import {generatePlannedDraw} from '../../lib/planned-generation.ts';
import {resolveInferredLabels} from '../../lib/inferred-labels.ts';
import {spec as numberLineSpec} from '../../visuals/views/operations/operations-number-line-representation/spec.ts';
import {spec as readingSpec} from '../../visuals/views/numbers/numbers-read-standard/spec.ts';
import {WritingGeneratorSchema, spec, type WritingGeneratorConfig} from './spec.ts';
import {WritingGenerator} from './generator.ts';
import {resolveWritingRange} from './range-profile.ts';
import {createCanonicalNumericRange} from '../../lib/canonical-numeric-range.ts';

describe('WritingGenerator Spec Integration', () => {
    const generator = new WritingGenerator();
    const model = {generatorId: spec.generatorId, generalLabels: spec.generalLabels,
        schema: WritingGeneratorSchema, spec};
    const formerInference = [{produces: [Scope.NumbersWithoutZero],
        infer: ({requireZero, range}: WritingGeneratorConfig) => !requireZero && range && range.max > 100 && range.max <= 1000
            ? [Scope.NumbersWithoutZero] : []}];

    it('validates standalone fallback bounds without discarding a selected positive notation context', () => {
        expect(resolveWritingRange([Scope.NumbersSmaller10])).toEqual({min: 0, max: 10});
        expect(resolveWritingRange([Area.DigitNotation, Scope.NumbersWithoutZero, Scope.NumbersSmaller10])).toBeUndefined();
        expect(resolveWritingRange([Area.DigitNotation, Scope.NumbersWithoutZero, Scope.NumbersSmaller10,
            Scope.NumbersLarger5])).toEqual(createCanonicalNumericRange(10, 5));
    });

    it.each([Scope.NumbersSmaller120, Scope.NumbersSmaller1000])(
        'selects zero absence before generation for the positive %s profile', maximum => {
            for (let seed = 0; seed < 24; seed++) {
                setSeed(seed);
                const resolved = extractConfig(generator.schema, [Area.DigitNotation, maximum]);
                expect(resolved.resolvedLabels).toContain(Scope.NumbersWithoutZero);
                expect(resolved.config.requireZero).toBe(false);
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

    it('uses matching-capable declarations instead of the retired inference callback', () => {
        expect(spec.inferredLabels).toBeUndefined();
        const base = {notationFamily: Area.DigitNotation, requireZero: false};
        for (const maximum of [100, 101, 1000, 1001, 1000000]) {
            expect(resolveInferredLabels({spec, schema: WritingGeneratorSchema,
                config: {...base, range: {min: 0, max: maximum}}, labels: [], owner: 'generator'})).toEqual([]);
        }
        const zero = generateWithLabels(generator,
            [Area.DigitNotation, Scope.NumbersWithZero, Scope.NumbersSmaller1000]);
        expect(zero!.data.number).toBe(0);
        expect(zero!.labels).not.toContain(Scope.NumbersWithoutZero);
        const existing = generateWithLabels(generator,
            [Area.DigitNotation, Scope.NumbersWithoutZero, Scope.NumbersSmaller1000]);
        expect(existing!.labels.filter(label => label === Scope.NumbersWithoutZero)).toHaveLength(1);
    });

    it('does not substitute a scalar-writing payload for a rooted length relation', () => {
        const target = {id: 'bounded-line', labels: [Area.NumerationWithIntegers, Scope.Numberline,
            Scope.ArabicNumerals, Ability.VisualArticulation, Scope.NumbersSmaller100]};
        const result = matchTarget(target,
            {...model, problemType: 'WritingProblem', labels: [...spec.generalLabels, ...extractSchemaLabels(generator.schema)]},
            {viewId: numberLineSpec.viewId, problemType: 'WholeNumberLengthProblem',
                supportedLabels: [...numberLineSpec.generalLabels], generalLabels: numberLineSpec.generalLabels,
                schema: {}, spec: numberLineSpec});
        expect(result).toEqual({matched: false, reason: 'incompatible-type'});
    });

    it('preserves direct configurations, payloads and continuation when removing redundant inference', () => {
        const oldSpec = {...spec, inferredLabels: formerInference};
        for (const notation of [[], [Area.DigitNotation], [Area.NumerationWithIntegers], [Area.NumberNameNotation]]) {
            for (const maximum of [Scope.NumbersSmaller100, Scope.NumbersSmaller120,
                Scope.NumbersSmaller1000, Scope.NumbersSmaller1000000]) {
                for (const zero of [[], [Scope.NumbersWithZero], [Scope.NumbersWithoutZero]]) {
                    const labels = [...notation, maximum, ...zero];
                    if (notation.includes(Area.NumberNameNotation) && zero.includes(Scope.NumbersWithZero)) {
                        expect(() => extractConfig(generator.schema, labels)).toThrow();
                        continue;
                    }
                    for (const seed of [0, 17, 2026]) {
                        const draws = [oldSpec, spec].map(owner => {
                            setSeed(seed);
                            const resolved = extractConfig(generator.schema, labels, {spec: owner, owner: 'generator'});
                            const configState = getRandomState();
                            return {...resolved, configState, stub: generator.generate(resolved.config), state: getRandomState()};
                        });
                        const {resolvedLabels: beforeLabels, ...before} = draws[0];
                        const {resolvedLabels: afterLabels, ...after} = draws[1];
                        expect(after).toEqual(before);
                        expect(new Set(afterLabels)).toEqual(new Set(beforeLabels));
                    }
                }
            }
        }
    });

    it('preserves planned draws and explicit zero absence after retiring inference', () => {
        const target = {id: 'read-legacy', labels: [Area.DigitNotation, Scope.NumbersSmaller1000,
            Scope.ArabicNumerals, Ability.TextualReception]};
        const result = planModelCompatibility(target, model, {viewId: readingSpec.viewId,
            generalLabels: readingSpec.generalLabels, schema: {}, spec: readingSpec});
        expect(result.supported).toBe(true);
        if (!result.supported) throw new Error('Expected legacy reading to remain admitted.');
        const input = {generator, viewSchema: {}, viewSpec: readingSpec, plan: result.plan,
            sampleKey: 'read-legacy#writing#numbers-read-standard#train#question#inst:0', attempt: 1, seed: 42};
        const old = generatePlannedDraw({...input, generatorSpec: {...spec, inferredLabels: formerInference}});
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
            expect(stub!.data.number).toBeGreaterThan(10);
            expect(stub!.data.number).toBeLessThan(20);
            expect(stub!.labels).toContain(Scope.NumbersWithoutZero);
        }
    });

    it('resolves the strict scalar interior under inclusive NumbersSmaller120', () => {
        for (let seed = 0; seed < 50; seed++) {
            setSeed(seed);
            const stub = generateWithLabels(generator, [
                Area.DigitNotation,
                Scope.NumbersWithoutZero,
                Scope.NumbersSmaller120
            ]);
            expect(stub).not.toBeNull();
            expect(stub!.data.number).toBeGreaterThan(100);
            expect(stub!.data.number).toBeLessThan(120);
            expect(stub!.labels).toContain(Scope.NumbersSmaller120);
        }
    });

    it('resolves the strict scalar interior under inclusive NumbersSmaller1000', () => {
        for (let seed = 0; seed < 50; seed++) {
            setSeed(seed);
            const stub = generateWithLabels(generator, [
                Area.DigitNotation,
                Scope.NumbersWithoutZero,
                Scope.NumbersSmaller1000
            ]);
            expect(stub).not.toBeNull();
            expect(stub!.data.number).toBeGreaterThan(120);
            expect(stub!.data.number).toBeLessThan(1000);
            expect(stub!.labels).toContain(Scope.NumbersSmaller1000);
        }
    });

    it.each([
        Area.DigitNotation,
        Area.NumberNameNotation
    ] as const)('resolves Grade 4 %s through one million', notationFamily => {
        setSeed(404);
        const maximum = notationFamily === Area.NumberNameNotation ? Scope.NumbersSmaller10000 : Scope.NumbersSmaller1000000;
        const minimum = notationFamily === Area.NumberNameNotation ? Scope.NumbersLarger1000 : Scope.NumbersLarger100000;
        const stub = generateWithLabels(generator, [
            notationFamily,
            Scope.Base10,
            minimum,
            maximum
        ]);

        expect(stub).not.toBeNull();
        expect('placeValues' in stub!.data && stub!.data.placeValues.length).toBeGreaterThanOrEqual(4);
        expect(stub!.data.number).toBeGreaterThanOrEqual(1000);
        expect(stub!.data.number).toBeLessThanOrEqual(1_000_000);
        expect(stub!.labels).toEqual(expect.arrayContaining([
            notationFamily,
            minimum,
            maximum
        ]));
    });
});
