import { describe, it, expect, beforeEach } from 'vitest';
import { TimeGenerator } from './generator.ts';
import { generationConfig } from './permutations.ts';
import { setSeed } from '../../lib/random.ts';
import { Scope } from 'edugraph-ts';

describe('TimeGenerator', () => {
    let generator: TimeGenerator;

    beforeEach(() => {
        generator = new TimeGenerator();
        setSeed(generationConfig.seed);
    });

    it('should have the correct type', () => {
        expect(generator.type).toBe('time');
    });

    describe('generate', () => {
        it('should generate valid problem stubs for all permutations', () => {
            generationConfig.permutations.forEach(input => {
                const stub = generator.generate(input);
                if (stub) {
                    expect(stub.id).toBeDefined();
                    expect(stub.data.time).toMatch(/^\d{2}:\d{2}:\d{2}$/);
                    // Either constraint or default based on labels
                    const expectedInterval = input.constraints.interval || 
                                            (input.labels.includes(Scope.HourIntervals) ? 3600 : 
                                             input.labels.includes(Scope.MinuteIntervals) ? 60 : 1);
                    expect(stub.data.interval).toBe(expectedInterval);
                }
            });
        });

        it('should be deterministic with the same seed', () => {
            const input = generationConfig.permutations[0];
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
