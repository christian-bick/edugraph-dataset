import {describe, expect, it} from 'vitest';
import {setSeed} from '../../../lib/random.ts';
import {MeasurementDataGenerator} from './generator.ts';

describe('MeasurementDataGenerator', () => {
    it('generates six whole-centimeter observations in a compact range', () => {
        setSeed(42);
        const problem = new MeasurementDataGenerator().generate({});

        expect(problem.data.unit).toBe('cm');
        expect(problem.data.observations).toHaveLength(6);
        expect(new Set(problem.data.observations.map(({object}) => object)).size).toBe(6);
        for (const observation of problem.data.observations) {
            expect(Number.isInteger(observation.length)).toBe(true);
            expect(observation.length).toBeGreaterThanOrEqual(2);
            expect(observation.length).toBeLessThanOrEqual(10);
        }
    });

    it('is deterministic for the same seed', () => {
        const generator = new MeasurementDataGenerator();
        setSeed(7);
        const first = generator.generate({});
        setSeed(7);
        expect(generator.generate({})).toEqual(first);
    });

    it('rejects a missing configuration object', () => {
        expect(() => new MeasurementDataGenerator().generate(null as never)).toThrow();
    });
});
