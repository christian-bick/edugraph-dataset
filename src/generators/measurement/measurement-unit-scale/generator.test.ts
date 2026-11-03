import {afterEach, describe, expect, it, vi} from 'vitest';
import * as rng from '../../../lib/random.ts';
import {getRandomState, random, setSeed} from '../../../lib/random.ts';
import {createCanonicalNumericRange} from '../../../lib/canonical-numeric-range.ts';
import {unitScaleDomain} from '../unit-scale-domain.ts';
import {MeasurementUnitScaleGenerator} from './generator.ts';

afterEach(() => vi.restoreAllMocks());

describe('MeasurementUnitScaleGenerator', () => {
    const generator = new MeasurementUnitScaleGenerator();

    it('generates bounded equivalent partitions with every supported count and factor', () => {
        const states = new Set<string>();
        for (let seed = 0; seed < 500; seed++) {
            setSeed(seed);
            const range = createCanonicalNumericRange(seed % 2 ? 20 : 10);
            const data = generator.generate({range}).data;
            expect(data.largeUnitCount).toBeGreaterThanOrEqual(3);
            expect(data.largeUnitCount).toBeLessThanOrEqual(6);
            expect(data.unitsPerLarge).toBeGreaterThanOrEqual(2);
            expect(data.unitsPerLarge).toBeLessThanOrEqual(3);
            expect(data.smallUnitCount).toBe(data.largeUnitCount * data.unitsPerLarge);
            expect(data.smallUnitCount).toBeGreaterThan(data.largeUnitCount);
            states.add(`${data.largeUnitCount}:${data.unitsPerLarge}`);

            setSeed(seed);
            expect(generator.generate({range}).data).toEqual(data);
        }
        expect(states.size).toBe(8);
    });

    it('rejects missing and unsupported range constraints', () => {
        expect(() => generator.generate({})).toThrow(/Required field "range"/);
        expect(() => generator.generate(null as never)).toThrow(
            '[Generator: measurement-unit-scale] Validation Error'
        );
        expect(() => generator.generate(undefined as never)).toThrow();
        expect(() => generator.generate({range: createCanonicalNumericRange(5)})).toThrow();
        expect(() => generator.generate({range: createCanonicalNumericRange(10, 5)})).toThrow();
    });

    it.each([10, 20])('preserves every factor-bearing outcome and two-draw continuation in upper%s', upper => {
        const range = createCanonicalNumericRange(upper), rows = unitScaleDomain('factor', range);
        const mock = vi.spyOn(rng, 'random');
        for (const expected of rows) {
            const qRows = rows.filter(row => row.largeUnitCount === expected.largeUnitCount);
            mock.mockReturnValueOnce((rows.filter(row => row.largeUnitCount < expected.largeUnitCount).length + qRows.length / 2) / rows.length);
            mock.mockReturnValueOnce((qRows.findIndex(row => row.unitsPerLarge === expected.unitsPerLarge) + 0.5) / qRows.length);
            expect(generator.generate({range})).toEqual({data: expected});
        }
        expect(mock).toHaveBeenCalledTimes(rows.length * 2);
        mock.mockRestore();
        setSeed(37); random(); random(); const state = getRandomState();
        setSeed(37); generator.generate({range}); expect(getRandomState()).toBe(state);
    });
});
