import {beforeEach, describe, expect, it} from 'vitest';
import {TimeGenerator} from './generator.ts';
import {setSeed} from '../../lib/random.ts';
import {Area, Scope} from 'edugraph-ts';
import {generateWithLabels} from '../../lib/utils.ts';

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
                Scope.StepsOf5,
                periodLabel
            ]);
            const {hour, minute, second} = timeParts(stub!.data.secondsSinceMidnight);

            expect(stub).not.toBeNull();
            expect(stub!.labels).toEqual(expect.arrayContaining([Scope.StepsOf5, periodLabel]));
            expect(minute % 5).toBe(0);
            expect(second).toBe(0);
            expect(hour).toBeGreaterThanOrEqual(minHour);
            expect(hour).toBeLessThanOrEqual(maxHour);
            expect(stub!.data.period).toBe(expectedPeriod);
        }
    });
});
