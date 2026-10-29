import {beforeEach, describe, expect, it} from 'vitest';
import {TimeGenerator} from './generator.ts';
import {spec, TimeGeneratorSchema} from './spec.ts';
import {getRandomState, setSeed} from '../../lib/random.ts';
import {Area, Scope} from 'edugraph-ts';
import {extractConfig, generateWithLabels} from '../../lib/utils.ts';
import {planModelCompatibility} from '../../lib/model-compatibility.ts';
import {generatePlannedDraw} from '../../lib/planned-generation.ts';
import {validateTimeProblem} from '../../visuals/views/time/time-presentation.ts';
import {formatTime} from '../../visuals/views/time/time-analog/helpers.ts';
import {formatDigitalTime, formatTimeClue} from '../../visuals/views/time/time-digital/helpers.ts';
import {spec as analog} from '../../visuals/views/time/time-analog/spec.ts';
import {spec as analogConstruction} from '../../visuals/views/time/time-analog-construction/spec.ts';
import {spec as digital} from '../../visuals/views/time/time-digital/spec.ts';
import {spec as digitalConstruction} from '../../visuals/views/time/time-digital-construction/spec.ts';

const timeParts = (secondsSinceMidnight: number) => ({
    hour: Math.floor(secondsSinceMidnight / 3600),
    minute: Math.floor(secondsSinceMidnight % 3600 / 60),
    second: secondsSinceMidnight % 60
});

describe('TimeGenerator Spec Integration', () => {
    let generator: TimeGenerator;

    beforeEach(() => {
        generator = new TimeGenerator();
        setSeed(42);
    });

    it('declares invariant integer, nonnegative time measurement', () => {
        expect(spec.generalLabels).toEqual([Area.MeasuringTime, Scope.IntegerNumbers, Scope.NumbersWithoutNegatives]);
    });

    it('keeps every possible selected clock component positive at the annotated precisions', () => {
        for (const [intervalSeconds, minutes] of [[1800, [30]], [60, [5, 15, 25, 35, 45, 55]]] as const) {
            for (let hour = 0; hour < 24; hour++) {
                for (const minute of minutes) {
                    const data = {secondsSinceMidnight: hour * 3600 + minute * 60, intervalSeconds};
                    for (const viewId of ['time-analog', 'time-analog-construction', 'time-digital',
                        'time-digital-construction'] as const) {
                        const parts = validateTimeProblem(viewId, data);
                        expect(parts.hour).toBeGreaterThan(0);
                        expect(parts.minute).toBeGreaterThan(0);
                        expect(parts).not.toHaveProperty('second');
                        expect(formatTime(data.secondsSinceMidnight, intervalSeconds)).toBe(formatDigitalTime(parts));
                        expect(formatTimeClue(parts)).not.toContain('zero');
                    }
                }
            }
        }
    });

    it.each([
        [Scope.HalfHourIntervals], [Scope.MinuteIntervals, Scope.MultiplesOf5]
    ].map(labels => ({labels})))('adds zero absence only to the supported positive components: $labels', ({labels}) => {
        for (const period of [[], [Scope.AnteMeridiem], [Scope.PostMeridiem]]) {
            for (const seed of [0, 1, 17, 42]) {
                setSeed(seed);
                const stub = generateWithLabels(generator, [...labels, ...period]);
                expect(stub).not.toBeNull();
                expect(stub!.labels).toContain(Scope.NumbersWithoutZero);
                expect(stub!.labels).not.toContain(Scope.NumbersWithZero);
                const parts = validateTimeProblem('time-digital', stub!.data);
                expect(parts.hour).toBeGreaterThan(0);
                expect(parts.minute).toBeGreaterThan(0);
                expect(parts).not.toHaveProperty('second');
            }
        }
    });

    it.each([
        [Scope.MinuteIntervals], [Scope.SecondIntervals],
        [Scope.HalfHourIntervals, Scope.NumbersWithZero],
        [Scope.MinuteIntervals, Scope.MultiplesOf5, Scope.NumbersWithZero]
    ].map(labels => ({labels})))('retains abstention and explicit zero requests: $labels', ({labels}) => {
        const stub = generateWithLabels(generator, labels);
        expect(stub).not.toBeNull();
        expect(stub!.labels).not.toContain(Scope.NumbersWithoutZero);
        if (labels.includes(Scope.NumbersWithZero)) expect(stub!.labels).toContain(Scope.NumbersWithZero);
    });

    it('preserves direct configurations, mathematical samples and entropy including interval fallback', () => {
        const withoutInference = {...spec, inferredLabels: undefined};
        for (const interval of [[], [Scope.HourIntervals], [Scope.HalfHourIntervals], [Scope.MinuteIntervals],
            [Scope.MinuteIntervals, Scope.MultiplesOf5], [Scope.SecondIntervals]]) {
            for (const zero of [[], [Scope.NumbersWithZero]]) {
                for (const period of [[], [Scope.AnteMeridiem], [Scope.PostMeridiem]]) {
                    for (const seed of [0, 1, 17, 42]) {
                        const labels = [...interval, ...zero, ...period];
                        const draws = [withoutInference, spec].map(owner => {
                            setSeed(seed);
                            const resolved = extractConfig(generator.schema, labels, {spec: owner, owner: 'generator'});
                            const configurationState = getRandomState();
                            const stub = generator.generate(resolved.config);
                            return {config: resolved.config, configurationState, stub, randomState: getRandomState()};
                        });
                        expect(draws[1]).toEqual(draws[0]);
                    }
                }
            }
        }
    });

    it('proves the zero minute component for every whole hour and all four consumers', () => {
        for (let hour = 0; hour < 24; hour++) {
            const data = {secondsSinceMidnight: hour * 3600, intervalSeconds: 3600 as const};
            for (const viewId of ['time-analog', 'time-analog-construction', 'time-digital',
                'time-digital-construction'] as const) {
                const parts = validateTimeProblem(viewId, data);
                expect(parts.minute).toBe(0);
                expect(formatTime(data.secondsSinceMidnight, 3600)).toMatch(/:00$/);
                expect(formatDigitalTime(parts)).toMatch(/:00$/);
                expect(formatTimeClue(parts)).toContain("o'clock");
            }
        }
        for (const period of [[], [Scope.AnteMeridiem], [Scope.PostMeridiem]]) {
            for (const explicitZero of [[], [Scope.NumbersWithZero]]) {
                const stub = generateWithLabels(generator, [Scope.HourIntervals, ...period, ...explicitZero]);
                expect(stub!.labels).toContain(Scope.NumbersWithZero);
                expect(stub!.labels).not.toContain(Scope.NumbersWithoutZero);
            }
        }
    });

    it.each([analog, analogConstruction, digital, digitalConstruction])(
        'preserves whole-hour matching and replay for $viewId', view => {
            const model = {generatorId: spec.generatorId, generalLabels: spec.generalLabels,
                schema: TimeGeneratorSchema, spec};
            const consumer = {viewId: view.viewId, generalLabels: view.generalLabels, schema: {}, spec: view};
            const labels = [Area.MeasuringTime, Scope.HourIntervals, ...view.generalLabels];
            const result = planModelCompatibility({id: 'whole-hour-clock', labels}, model, consumer);
            expect(result.supported).toBe(true);
            if (!result.supported) throw new Error('Expected the original whole-hour target to remain admitted.');
            expect(planModelCompatibility({id: 'whole-hour-without-zero',
                labels: [...labels, Scope.NumbersWithoutZero]}, model, consumer).supported).toBe(false);
            const input = {generator, generatorSpec: spec, viewSpec: view, viewSchema: {}, plan: result.plan,
                sampleKey: `whole-hour-clock#time#${view.viewId}#train#question#inst:0`, attempt: 1, seed: 42};
            const draw = generatePlannedDraw(input);
            const state = getRandomState();
            expect(draw.labels).toContain(Scope.NumbersWithZero);
            expect(draw.labels).not.toContain(Scope.NumbersWithoutZero);
            expect(generatePlannedDraw({...input, replay: draw.replay})).toEqual(draw);
            expect(getRandomState()).toBe(state);
        }
    );

    it.each([analog, analogConstruction, digital, digitalConstruction])(
        'resolves and replays the annotation without admitting new targets for $viewId', view => {
            const model = {generatorId: spec.generatorId, generalLabels: spec.generalLabels,
                schema: TimeGeneratorSchema, spec};
            const consumer = {viewId: view.viewId, generalLabels: view.generalLabels, schema: {}, spec: view};
            const labels = [Area.MeasuringTime, Scope.HalfHourIntervals, ...view.generalLabels];
            const result = planModelCompatibility({id: 'positive-clock', labels}, model, consumer);
            expect(result.supported).toBe(true);
            if (!result.supported) throw new Error('Expected the original positive clock target to remain admitted.');
            expect(planModelCompatibility({id: 'zero-absence-request',
                labels: [...labels, Scope.NumbersWithoutZero]}, model, consumer).supported).toBe(false);
            const input = {generator, generatorSpec: spec, viewSpec: view, viewSchema: {}, plan: result.plan,
                sampleKey: `positive-clock#time#${view.viewId}#train#question#inst:0`, attempt: 1, seed: 42};
            const draw = generatePlannedDraw(input);
            const randomState = getRandomState();
            expect(draw.stub).not.toBeNull();
            expect(draw.labels).toContain(Scope.NumbersWithoutZero);
            expect(generatePlannedDraw({...input, replay: draw.replay})).toEqual(draw);
            expect(getRandomState()).toBe(randomState);
        }
    );

    it('should generate hour intervals when HourIntervals is targeted', () => {
        for (let i = 0; i < 20; i++) {
            const stub = generateWithLabels(generator, [
                Area.MeasuringTime,
                Scope.HourIntervals
            ]);
            expect(stub).not.toBeNull();
            expect(stub!.data.intervalSeconds).toBe(3600);
            
            const {minute: m, second: s} = timeParts(stub!.data.secondsSinceMidnight);
            expect(m).toBe(0);
            expect(s).toBe(0);
        }
    });

    it('should generate minute intervals when MinuteIntervals is targeted', () => {
        for (let i = 0; i < 20; i++) {
            const stub = generateWithLabels(generator, [
                Area.MeasuringTime,
                Scope.MinuteIntervals
            ]);
            expect(stub).not.toBeNull();
            expect(stub!.data.intervalSeconds).toBe(60);
            
            const {second: s} = timeParts(stub!.data.secondsSinceMidnight);
            expect(s).toBe(0);
        }
    });

    it('should generate half-hour intervals when HalfHourIntervals is targeted', () => {
        for (let i = 0; i < 20; i++) {
            const stub = generateWithLabels(generator, [
                Area.MeasuringTime,
                Scope.HalfHourIntervals
            ]);
            expect(stub).not.toBeNull();
            expect(stub!.data.intervalSeconds).toBe(1800);

            const {minute: m, second: s} = timeParts(stub!.data.secondsSinceMidnight);
            expect([0, 30]).toContain(m);
            expect(s).toBe(0);
        }
    });

    it('should generate second intervals when SecondIntervals is targeted', () => {
        for (let i = 0; i < 20; i++) {
            const stub = generateWithLabels(generator, [
                Area.MeasuringTime,
                Scope.SecondIntervals
            ]);
            expect(stub).not.toBeNull();
            expect(stub!.data.intervalSeconds).toBe(1);
        }
    });

    it('should resolve NumbersWithZero into an observable zero-valued time component', () => {
        for (let seed = 0; seed < 50; seed++) {
            setSeed(seed);
            const stub = generateWithLabels(generator, [
                Area.MeasuringTime,
                Scope.SecondIntervals,
                Scope.NumbersWithZero
            ]);
            const components = Object.values(timeParts(stub!.data.secondsSinceMidnight));

            expect(stub).not.toBeNull();
            expect(stub!.labels).toContain(Scope.NumbersWithZero);
            expect(components.some((component: number) => component === 0)).toBe(true);
        }
    });

    it.each([
        [Scope.AnteMeridiem, 'ante-meridiem', 0, 11],
        [Scope.PostMeridiem, 'post-meridiem', 12, 23]
    ] as const)('should resolve five-minute %s times', (periodLabel, expectedPeriod, minHour, maxHour) => {
        for (let seed = 0; seed < 50; seed++) {
            setSeed(seed);
            const stub = generateWithLabels(generator, [
                Area.MeasuringTime,
                Scope.MinuteIntervals,
                Scope.MultiplesOf5,
                periodLabel
            ]);
            const {hour, minute, second} = timeParts(stub!.data.secondsSinceMidnight);

            expect(stub).not.toBeNull();
            expect(stub!.labels).toEqual(expect.arrayContaining([Scope.MultiplesOf5, periodLabel]));
            expect(stub!.labels).not.toContain(Scope.StepsOf5);
            expect(minute % 10).toBe(5);
            expect(second).toBe(0);
            expect(hour).toBeGreaterThanOrEqual(minHour);
            expect(hour).toBeLessThanOrEqual(maxHour);
            expect(stub!.data.period).toBe(expectedPeriod);
        }
    });
});
