import { describe, it, expect, beforeEach } from 'vitest';
import { TimeGenerator } from './generator.ts';
import { setSeed } from '../../lib/random.ts';
import { Scope } from 'edugraph-ts';

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
            const inputs = [
                { labels: [Scope.HourIntervals], constraints: { interval: 3600 } },
                { labels: [Scope.MinuteIntervals], constraints: { interval: 60 } },
                { labels: [Scope.SecondIntervals], constraints: { interval: 1 } }
            ];
            inputs.forEach(input => {
                const stub = generator.generate(input);
                expect(stub).not.toBeNull();
                expect(stub!.id).toBeDefined();
                expect(stub!.data.time).toMatch(/^\d{2}:\d{2}:\d{2}$/);
                expect(stub!.data.interval).toBe(input.constraints.interval);
            });
        });

        it('should be deterministic with the same seed', () => {
            const input = { labels: [Scope.HourIntervals], constraints: { interval: 3600 } };
            setSeed(123);
            const stub1 = generator.generate(input);
            setSeed(123);
            const stub2 = generator.generate(input);
            expect(stub1).toEqual(stub2);
        });
    });

    describe('generate edge cases', () => {
        it('should align time with the requested interval (1 hour)', () => {
            const input = { 
                labels: [], 
                constraints: { interval: 3600 } 
            };
            for (let i = 0; i < 50; i++) {
                const stub = generator.generate(input);
                if (stub) {
                    const [h, m, s] = stub.data.time.split(':').map(Number);
                    expect(m).toBe(0);
                    expect(s).toBe(0);
                    expect(h).toBeLessThan(24);
                }
            }
        });

        it('should align time with the requested interval (15 minutes)', () => {
            const input = { 
                labels: [], 
                constraints: { interval: 900 } 
            };
            for (let i = 0; i < 50; i++) {
                const stub = generator.generate(input);
                if (stub) {
                    const [, m, s] = stub.data.time.split(':').map(Number);
                    expect(m % 15).toBe(0);
                    expect(s).toBe(0);
                }
            }
        });

        it('should never exceed 23:59:59', () => {
            const input = { 
                labels: [], 
                constraints: { interval: 1 } 
            };
            for (let i = 0; i < 100; i++) {
                const stub = generator.generate(input);
                if (stub) {
                    const [h, m, s] = stub.data.time.split(':').map(Number);
                    expect(h).toBeLessThan(24);
                    expect(m).toBeLessThan(60);
                    expect(s).toBeLessThan(60);
                }
            }
        });
    });
});
