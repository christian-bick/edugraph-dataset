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
                { intervalLabel: Scope.HourIntervals },
                { intervalLabel: Scope.MinuteIntervals },
                { intervalLabel: Scope.SecondIntervals }
            ];
            configs.forEach(config => {
                const stub = generator.generate(config);
                expect(stub).not.toBeNull();
                expect(stub!.id).toBeDefined();
                expect(stub!.data.time).toMatch(/^\d{2}:\d{2}:\d{2}$/);
                let expectedInterval = 3600;
                if (config.intervalLabel === Scope.SecondIntervals) expectedInterval = 1;
                else if (config.intervalLabel === Scope.MinuteIntervals) expectedInterval = 60;
                expect(stub!.data.interval).toBe(expectedInterval);
            });
        });

        it('should be deterministic with the same seed', () => {
            const config = { intervalLabel: Scope.HourIntervals };
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
                intervalLabel: Scope.HourIntervals 
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

        it('should align time with the requested interval (15 minutes)', () => {
            const config = { 
                intervalLabel: Scope.HourIntervals 
            };
            for (let i = 0; i < 50; i++) {
                const stub = generator.generate(config);
                if (stub) {
                    const [, m, s] = stub.data.time.split(':').map(Number);
                    expect(m % 15).toBe(0);
                    expect(s).toBe(0);
                }
            }
        });

        it('should never exceed 23:59:59', () => {
            const config = { 
                intervalLabel: Scope.HourIntervals 
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
    });

    describe('validation', () => {
        it('should throw an error if intervalLabel is missing', () => {
            expect(() => generator.generate({} as any)).toThrow();
        });
    });
});
