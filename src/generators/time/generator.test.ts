import {beforeEach, describe, expect, it} from 'vitest';
import {TimeGenerator} from './generator.ts';
import {setSeed} from '../../lib/random.ts';
import {Scope} from 'edugraph-ts';

describe('TimeGenerator', () => {
    let generator: TimeGenerator;

    beforeEach(() => {
        generator = new TimeGenerator();
        setSeed(42);
    });

    it('should have the correct type', () => {
        expect(generator.type).toBe('time');
    });

    describe('generate', () => {
        it('should generate valid problem stubs', () => {
            const configs = [
                { intervalLabel: Scope.HourIntervals, requireZero: false, requireFiveMinuteStep: false, isAnteMeridiem: false, isPostMeridiem: false },
                { intervalLabel: Scope.HalfHourIntervals, requireZero: false, requireFiveMinuteStep: false, isAnteMeridiem: false, isPostMeridiem: false },
                { intervalLabel: Scope.MinuteIntervals, requireZero: false, requireFiveMinuteStep: false, isAnteMeridiem: false, isPostMeridiem: false },
                { intervalLabel: Scope.SecondIntervals, requireZero: false, requireFiveMinuteStep: false, isAnteMeridiem: false, isPostMeridiem: false }
            ];
            configs.forEach(config => {
                const stub = generator.generate(config);
                expect(stub).not.toBeNull();
                expect(stub!.data.time).toMatch(/^\d{2}:\d{2}:\d{2}$/);
                let expectedInterval = 3600;
                if (config.intervalLabel === Scope.SecondIntervals) expectedInterval = 1;
                else if (config.intervalLabel === Scope.MinuteIntervals) expectedInterval = 60;
                else if (config.intervalLabel === Scope.HalfHourIntervals) expectedInterval = 1800;
                expect(stub!.data.interval).toBe(expectedInterval);
            });
        });

        it('should be deterministic with the same seed', () => {
            const config = { intervalLabel: Scope.HourIntervals, requireZero: false, requireFiveMinuteStep: false, isAnteMeridiem: false, isPostMeridiem: false };
            setSeed(123);
            const stub1 = generator.generate(config);
            setSeed(123);
            const stub2 = generator.generate(config);
            expect(stub1).toEqual(stub2);
        });
    });

    describe('generate edge cases', () => {
        it('should align time with the requested interval (1 hour)', () => {
            const config = { 
                intervalLabel: Scope.HourIntervals,
                requireZero: false,
                requireFiveMinuteStep: false,
                isAnteMeridiem: false,
                isPostMeridiem: false
            };
            for (let i = 0; i < 50; i++) {
                const stub = generator.generate(config);
                if (stub) {
                    const [h, m, s] = stub.data.time.split(':').map(Number);
                    expect(m).toBe(0);
                    expect(s).toBe(0);
                    expect(h).toBeLessThan(24);
                }
            }
        });

        it('should make half-hour intervals visually distinguishable from whole-hour intervals', () => {
            const config = { 
                intervalLabel: Scope.HalfHourIntervals,
                requireZero: false,
                requireFiveMinuteStep: false,
                isAnteMeridiem: false,
                isPostMeridiem: false
            };
            for (let i = 0; i < 50; i++) {
                const stub = generator.generate(config);
                if (stub) {
                    const [, m, s] = stub.data.time.split(':').map(Number);
                    expect(m).toBe(30);
                    expect(s).toBe(0);
                }
            }
        });

        it('should never exceed 23:59:59', () => {
            const config = { 
                intervalLabel: Scope.HourIntervals,
                requireZero: false,
                requireFiveMinuteStep: false,
                isAnteMeridiem: false,
                isPostMeridiem: false
            };
            for (let i = 0; i < 100; i++) {
                const stub = generator.generate(config);
                if (stub) {
                    const [h, m, s] = stub.data.time.split(':').map(Number);
                    expect(h).toBeLessThan(24);
                    expect(m).toBeLessThan(60);
                    expect(s).toBeLessThan(60);
                }
            }
        });

        it.each([
            Scope.HourIntervals,
            Scope.HalfHourIntervals,
            Scope.MinuteIntervals,
            Scope.SecondIntervals
        ])('should guarantee an observable zero for %s', intervalLabel => {
            for (let seed = 0; seed < 50; seed++) {
                setSeed(seed);
                const stub = generator.generate({
                    intervalLabel,
                    requireZero: true,
                    requireFiveMinuteStep: false,
                    isAnteMeridiem: false,
                    isPostMeridiem: false
                });
                const components = stub!.data.time.split(':').map(Number);

                expect(components.some((component: number) => component === 0)).toBe(true);
            }
        });

        it('should generate only five-minute values when requested', () => {
            for (let seed = 0; seed < 50; seed++) {
                setSeed(seed);
                const stub = generator.generate({
                    intervalLabel: Scope.MinuteIntervals,
                    requireZero: false,
                    requireFiveMinuteStep: true,
                    isAnteMeridiem: false,
                    isPostMeridiem: false
                });
                const [, minute, second] = stub!.data.time.split(':').map(Number);
                expect(minute % 5).toBe(0);
                expect(minute).toBeGreaterThan(0);
                expect(second).toBe(0);
            }
        });

        it.each([
            [true, false, 'a.m.', 0, 11],
            [false, true, 'p.m.', 12, 23]
        ] as const)('should constrain the requested day period', (isAnteMeridiem, isPostMeridiem, period, minHour, maxHour) => {
            for (let seed = 0; seed < 50; seed++) {
                setSeed(seed);
                const stub = generator.generate({
                    intervalLabel: Scope.MinuteIntervals,
                    requireZero: false,
                    requireFiveMinuteStep: true,
                    isAnteMeridiem,
                    isPostMeridiem
                });
                const hour = Number(stub!.data.time.slice(0, 2));
                expect(hour).toBeGreaterThanOrEqual(minHour);
                expect(hour).toBeLessThanOrEqual(maxHour);
                expect(stub!.data.period).toBe(period);
            }
        });
    });

    describe('validation', () => {
        it('should throw an error if intervalLabel is missing', () => {
            expect(() => generator.generate({} as any)).toThrow();
        });

        it('should throw an error if requireZero is missing', () => {
            expect(() => generator.generate({intervalLabel: Scope.HourIntervals} as any)).toThrow();
        });

        it('should throw an error for an unsupported interval label', () => {
            expect(() => generator.generate({
                intervalLabel: Scope.DayIntervals,
                requireZero: false,
                requireFiveMinuteStep: false,
                isAnteMeridiem: false,
                isPostMeridiem: false
            } as any)).toThrow('Unsupported interval label');
        });

        it('should reject contradictory day periods', () => {
            expect(() => generator.generate({
                intervalLabel: Scope.MinuteIntervals,
                requireZero: false,
                requireFiveMinuteStep: true,
                isAnteMeridiem: true,
                isPostMeridiem: true
            })).toThrow('both ante meridiem and post meridiem');
        });
    });
});
