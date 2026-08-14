import {Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {setSeed} from '../../../lib/random.ts';
import {MeasurementDataGenerator} from './generator.ts';

describe('MeasurementDataGenerator', () => {
    it('generates six whole-centimeter observations in a compact range', () => {
        setSeed(42);
        const problem = new MeasurementDataGenerator().generate({numberKind: Scope.IntegerNumbers});

        expect(problem.data.unit).toBe('cm');
        expect(problem.data.subdivisions).toBe(1);
        expect(problem.data.observations).toHaveLength(6);
        expect(new Set(problem.data.observations.map(({object}) => object)).size).toBe(6);
        for (const observation of problem.data.observations) {
            expect(Number.isInteger(observation.length)).toBe(true);
            expect(observation.length).toBeGreaterThanOrEqual(2);
            expect(observation.length).toBeLessThanOrEqual(10);
        }
    });

    it('generates quarter-inch observations including halves and fourths', () => {
        setSeed(42);
        const data = new MeasurementDataGenerator().generate({numberKind: Scope.FractionNumbers}).data;
        const quarterUnits = data.observations.map(({length}) => length * 4);

        expect(data.unit).toBe('in');
        expect(data.subdivisions).toBe(4);
        expect(quarterUnits.every(Number.isInteger)).toBe(true);
        expect(quarterUnits.every(value => value >= 8 && value <= 32)).toBe(true);
        expect(quarterUnits.some(value => value % 4 === 2)).toBe(true);
        expect(quarterUnits.some(value => value % 2 === 1)).toBe(true);
    });

    it('is deterministic for the same seed', () => {
        const generator = new MeasurementDataGenerator();
        setSeed(7);
        const first = generator.generate({numberKind: Scope.IntegerNumbers});
        setSeed(7);
        expect(generator.generate({numberKind: Scope.IntegerNumbers})).toEqual(first);
    });

    it('rejects a missing configuration object', () => {
        expect(() => new MeasurementDataGenerator().generate(null as never)).toThrow();
    });
});
