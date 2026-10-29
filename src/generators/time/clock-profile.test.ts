import {Area, Scope} from 'edugraph-ts';
import {afterEach, describe, expect, it, vi} from 'vitest';
import * as rng from '../../lib/random.ts';
import {extractConfig, findSchemaFallbackContractIssues, generateWithLabels} from '../../lib/utils.ts';
import {planModelCompatibility} from '../../lib/model-compatibility.ts';
import {generatePlannedDraw} from '../../lib/planned-generation.ts';
import {ClockProfile, clockProfileChoices, resolveClockProfile} from './clock-profile.ts';
import {TimeGenerator} from './generator.ts';
import {spec, TimeGeneratorSchema} from './spec.ts';
import {validateTimeProblem} from '../../visuals/views/time/time-presentation.ts';
import {spec as consumer} from '../../visuals/views/time/time-digital-construction/spec.ts';

afterEach(() => vi.restoreAllMocks());
const generator = new TimeGenerator();
const configuration = (profile: ClockProfile) => ({clockProfile: profile, requireMultipleOf5: false,
    isAnteMeridiem: false, isPostMeridiem: false});

describe('clock occurrence profile migration', () => {
    it('declares valid standalone bundles and rejects competing/impossible requests', () => {
        expect(findSchemaFallbackContractIssues(TimeGeneratorSchema)).toEqual([]);
        for (const labels of clockProfileChoices) expect(resolveClockProfile([...labels])).toBeDefined();
        for (const labels of [[], [Scope.MinuteIntervals],
            [Scope.MinuteIntervals, Scope.NumbersWithZero, Scope.NumbersWithoutZero],
            [Scope.HourIntervals, Scope.NumbersWithoutZero],
            [Scope.HalfHourIntervals, Scope.NumbersWithZero],
            [Scope.MinuteIntervals, Scope.MultiplesOf5, Scope.NumbersWithZero],
            [Scope.HourIntervals, Scope.MultiplesOf5],
            [Scope.SecondIntervals, Scope.NumbersWithoutZero],
            [Scope.HourIntervals, Scope.MinuteIntervals]]) expect(resolveClockProfile(labels)).toBeUndefined();
    });

    it('partitions every old minute-precision instant exactly once and uniformly within each profile', () => {
        const random = vi.spyOn(rng, 'random');
        const values: number[] = [];
        for (const [mode, count] of [['zero-minutes', 24], ['positive-minutes', 24 * 59]] as const) {
            const modeValues = new Set<number>();
            for (let index = 0; index < count; index++) {
                random.mockReturnValue((index + 0.5) / count);
                const data = generator.generate(configuration({intervalLabel: Scope.MinuteIntervals, mode}))!.data;
                const minute = data.secondsSinceMidnight % 3600 / 60;
                expect(minute === 0).toBe(mode === 'zero-minutes');
                modeValues.add(data.secondsSinceMidnight);
                values.push(data.secondsSinceMidnight);
            }
            expect(modeValues.size).toBe(count);
        }
        expect(new Set(values).size).toBe(1440);
        expect([...values].sort((a, b) => a - b)).toEqual(Array.from({length: 1440}, (_, i) => i * 60));
        expect(random).toHaveBeenCalledTimes(1440);
    });

    it.each(clockProfileChoices.map(labels => ({labels})))('emits truthful direct claims for $labels', ({labels}) => {
        for (const period of [[], [Scope.AnteMeridiem], [Scope.PostMeridiem]]) {
            for (const seed of [0, 1, 17, 42]) {
                rng.setSeed(seed);
                const stub = generateWithLabels(generator, [...labels, ...period])!;
                const parts = validateTimeProblem('time-digital-construction', stub.data);
                const zero = [parts.hour, parts.minute, parts.second].includes(0);
                if (stub.labels.includes(Scope.NumbersWithZero)) expect(zero).toBe(true);
                if (stub.labels.includes(Scope.NumbersWithoutZero)) expect(zero).toBe(false);
            }
        }
    });

    it('keeps the five-minute subset positive through direct fallback resolution', () => {
        for (let seed = 0; seed < 80; seed++) {
            rng.setSeed(seed);
            const resolved = extractConfig(TimeGeneratorSchema, [Scope.MinuteIntervals, Scope.MultiplesOf5]);
            expect(resolved.config.clockProfile!.mode).toBe('positive-minutes');
            expect(resolved.resolvedLabels).toContain(Scope.NumbersWithoutZero);
            expect(generator.generate(resolved.config)!.data.secondsSinceMidnight % 600).toBe(300);
        }
    });

    it.each([Scope.NumbersWithZero, Scope.NumbersWithoutZero])('matches and replays explicit minute %s', zero => {
        const model = {generatorId: spec.generatorId, generalLabels: spec.generalLabels,
            schema: TimeGeneratorSchema, spec};
        const view = {viewId: consumer.viewId, generalLabels: consumer.generalLabels, schema: {}, spec: consumer};
        const target = {id: 'minute-zero-profile', labels: [Area.MeasuringTime, Scope.MinuteIntervals,
            zero, ...consumer.generalLabels]};
        const match = planModelCompatibility(target, model, view);
        expect(match.supported).toBe(true);
        if (!match.supported) throw new Error(match.reason);
        const input = {generator, generatorSpec: spec, viewSpec: consumer, viewSchema: {}, plan: match.plan,
            sampleKey: `${target.id}#time#${view.viewId}#train#question#inst:0`, seed: 42, attempt: 1};
        const first = generatePlannedDraw(input);
        expect(first.labels).toContain(zero);
        expect(generatePlannedDraw({...input, replay: first.replay})).toEqual(first);
    });

    it('preserves existing non-minute mathematical paths and their entropy', () => {
        for (const [intervalLabel, mode, requireZero, requireMultipleOf5] of [
            [Scope.HourIntervals, 'whole-hour', false, false],
            [Scope.HalfHourIntervals, 'half-hour', false, false],
            [Scope.MinuteIntervals, 'positive-minutes', false, true],
            [Scope.SecondIntervals, 'legacy-seconds', false, false],
            [Scope.SecondIntervals, 'zero-seconds', true, false]
        ] as const) for (let seed = 0; seed < 30; seed++) {
            rng.setSeed(seed);
            const old = generator.generate({intervalLabel, requireZero, requireMultipleOf5,
                isAnteMeridiem: false, isPostMeridiem: false});
            const state = rng.getRandomState();
            rng.setSeed(seed);
            expect(generator.generate({...configuration({intervalLabel, mode}), requireMultipleOf5})).toEqual(old);
            expect(rng.getRandomState()).toBe(state);
        }
    });

    it('rejects malformed resolved profile combinations', () => {
        expect(() => generator.generate({...configuration({intervalLabel: Scope.HourIntervals,
            mode: 'positive-minutes'})})).toThrow(/profile combination/);
        expect(generator.generate({...configuration({intervalLabel: Scope.MinuteIntervals,
            mode: 'zero-minutes'}), requireMultipleOf5: true})).toBeNull();
    });
});
