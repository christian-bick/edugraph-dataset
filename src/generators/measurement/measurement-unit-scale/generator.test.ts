import {describe, expect, it} from 'vitest';
import {setSeed} from '../../../lib/random.ts';
import {MeasurementUnitScaleGenerator} from './generator.ts';

describe('MeasurementUnitScaleGenerator', () => {
    const generator = new MeasurementUnitScaleGenerator();

    it('generates bounded equivalent partitions with every supported count and factor', () => {
        const states = new Set<string>();
        for (let seed = 0; seed < 500; seed++) {
            setSeed(seed);
            const data = generator.generate({}).data;
            expect(data.largeUnitCount).toBeGreaterThanOrEqual(3);
            expect(data.largeUnitCount).toBeLessThanOrEqual(6);
            expect(data.unitsPerLarge).toBeGreaterThanOrEqual(2);
            expect(data.unitsPerLarge).toBeLessThanOrEqual(3);
            expect(data.smallUnitCount).toBe(data.largeUnitCount * data.unitsPerLarge);
            expect(data.smallUnitCount).toBeGreaterThan(data.largeUnitCount);
            states.add(`${data.largeUnitCount}:${data.unitsPerLarge}`);

            setSeed(seed);
            expect(generator.generate({}).data).toEqual(data);
        }
        expect(states.size).toBe(8);
    });

    it('accepts the empty configuration but rejects a missing configuration object', () => {
        expect(() => generator.generate({})).not.toThrow();
        expect(() => generator.generate(null as never)).toThrow(
            '[Generator: measurement-unit-scale] Validation Error'
        );
        expect(() => generator.generate(undefined as never)).toThrow();
    });
});
