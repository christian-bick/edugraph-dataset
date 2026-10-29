import {Ability, Area, Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {resolveInferredLabels} from '../../../lib/inferred-labels.ts';
import {planModelCompatibility} from '../../../lib/model-compatibility.ts';
import {generatePlannedDraw} from '../../../lib/planned-generation.ts';
import {getRandomState, setSeed} from '../../../lib/random.ts';
import {extractConfig, generateWithLabels} from '../../../lib/utils.ts';
import {spec as viewSpec} from '../../../visuals/views/numbers/numbers-rounding-line/spec.ts';
import {IntegerRoundingGenerator} from './generator.ts';
import {IntegerRoundingGeneratorSchema, spec} from './spec.ts';

describe('IntegerRoundingGenerator spec integration', () => {
    const generator = new IntegerRoundingGenerator();

    it.each([Scope.StepsOf10, Scope.StepsOf100, Scope.StepsOf1000])(
        'annotates positive endpoints and required rounding values for high-range %s', roundingMagnitude => {
            for (let seed = 0; seed < 24; seed++) {
                setSeed(seed);
                const stub = generateWithLabels(generator, [Scope.NumbersSmaller1000000, roundingMagnitude]);
                expect(stub).not.toBeNull();
                expect(stub!.labels).toContain(Scope.NumbersWithoutZero);
                expect(stub!.data.lowerMultiple).toBeGreaterThanOrEqual(1000);
                const data = stub!.data;
                for (const value of [data.number, data.roundingPlace, data.lowerMultiple, data.midpoint,
                    data.upperMultiple, data.roundedValue, data.distanceLower, data.distanceUpper]) {
                    expect(value).toBeGreaterThan(0);
                }
            }
        }
    );

    it.each([
        {range: {min: 0, max: 11}, roundingMagnitude: Scope.StepsOf10, zeroEndpoint: true},
        {range: {min: 0, max: 101}, roundingMagnitude: Scope.StepsOf100, zeroEndpoint: true},
        {range: {min: 1000, max: 1001}, roundingMagnitude: Scope.StepsOf10000, zeroEndpoint: true},
        {range: {min: 1000, max: 1001}, roundingMagnitude: Scope.StepsOf100000, zeroEndpoint: true}
    ] as const)('abstains when a supported configuration can expose zero: %j', config => {
        setSeed(0);
        const data = generator.generate(config)!.data;
        expect(data.lowerMultiple).toBe(0);
        expect(resolveInferredLabels({spec, schema: generator.schema, config,
            labels: [], owner: 'generator'})).toEqual([]);
    });

    it.each([
        {range: {min: 0, max: 1000}, roundingMagnitude: Scope.StepsOf10},
        {range: {min: 0, max: 1000}, roundingMagnitude: Scope.StepsOf100},
        {range: undefined, roundingMagnitude: Scope.StepsOf10},
        {range: {min: 0, max: 1000000}, roundingMagnitude: undefined}
    ] as const)('does not infer from one condition alone or unresolved values: %j', config => {
        expect(resolveInferredLabels({spec, schema: generator.schema, config,
            labels: [], owner: 'generator'})).toEqual([]);
    });

    it.each([Scope.StepsOf10, Scope.StepsOf100, Scope.StepsOf1000])(
        'preserves the admitted target and replays the resolved annotation for %s', roundingMagnitude => {
            const target = {id: 'rounding', labels: [Area.IntegerRounding, Scope.NumbersSmaller1000000,
                roundingMagnitude, ...viewSpec.generalLabels]};
            const model = {generatorId: spec.generatorId, generalLabels: spec.generalLabels,
                schema: IntegerRoundingGeneratorSchema, spec};
            const view = {viewId: viewSpec.viewId, generalLabels: viewSpec.generalLabels, schema: {}, spec: viewSpec};
            const result = planModelCompatibility(target, model, view);
            expect(result.supported).toBe(true);
            if (!result.supported) throw new Error('Expected the original rounding target to remain admitted.');
            const input = {generator, viewSchema: {}, generatorSpec: spec, viewSpec, plan: result.plan,
                sampleKey: 'rounding#integer-rounding#numbers-rounding-line#train#question#inst:0',
                attempt: 1, seed: 42};
            const draw = generatePlannedDraw(input);
            const state = getRandomState();
            expect(draw.labels).toContain(Scope.NumbersWithoutZero);
            expect(generatePlannedDraw({...input, replay: draw.replay})).toEqual(draw);
            expect(getRandomState()).toBe(state);
            expect(planModelCompatibility({...target, labels: [...target.labels, Scope.NumbersWithoutZero]},
                model, view).supported).toBe(true);
        }
    );

    it('preserves direct choices, payloads and random continuation, including an unspecified magnitude', () => {
        const withoutInference = {...spec, inferredLabels: undefined};
        for (const range of [Scope.NumbersSmaller1000, Scope.NumbersSmaller1000000]) {
            for (const magnitude of [[], ...IntegerRoundingGeneratorSchema.roundingMagnitude.map(label => [label])]) {
                for (const seed of [0, 1, 17, 2026]) {
                    const labels = [range, ...magnitude];
                    const draws = [withoutInference, spec].map(owner => {
                        setSeed(seed);
                        const resolved = extractConfig(generator.schema, labels, {spec: owner, owner: 'generator'});
                        const configurationState = getRandomState();
                        const stub = generator.generate(resolved.config);
                        return {config: resolved.config, labels: resolved.resolvedLabels,
                            configurationState, stub, state: getRandomState()};
                    });
                    expect(draws[1]).toEqual(draws[0]);
                }
            }
        }
    });

    it.each([Scope.StepsOf10, Scope.StepsOf100])('resolves %s', roundingMagnitude => {
        const stub = generateWithLabels(generator, [
            Scope.NumbersSmaller1000,
            roundingMagnitude
        ]);
        expect(stub).not.toBeNull();
        expect(stub!.labels).toEqual(expect.arrayContaining([
            Scope.NumbersSmaller1000,
            roundingMagnitude
        ]));
    });

    it.each([
        Scope.StepsOf10,
        Scope.StepsOf100,
        Scope.StepsOf1000,
        Scope.StepsOf10000,
        Scope.StepsOf100000
    ])('resolves the Grade 4 %s target labels', roundingMagnitude => {
        const stub = generateWithLabels(generator, [
            Area.IntegerRounding,
            Scope.ArabicNumerals,
            Scope.Base10,
            Scope.NumbersWithoutNegatives,
            Scope.NumbersSmaller1000000,
            Ability.ProcedureExecution,
            roundingMagnitude
        ]);

        expect(stub).not.toBeNull();
        expect('task' in stub!.data && stub!.data.task).toBe('multi-digit-integer-rounding');
        expect(stub!.labels).toEqual(expect.arrayContaining([
            Scope.NumbersSmaller1000000,
            roundingMagnitude
        ]));
    });
});
