import {describe, expect, it} from 'vitest';
import {MeasurementUnitScaleGenerator} from './generator.ts';

describe('MeasurementUnitScaleGenerator', () => {
    it('describes one length with inverse unit size and count', () => {
        const data = new MeasurementUnitScaleGenerator().generate({}).data;
        expect(data.smallUnitCount).toBe(data.largeUnitCount * data.unitsPerLarge);
        expect(data.unitsPerLarge).toBeGreaterThan(1);
    });
});
