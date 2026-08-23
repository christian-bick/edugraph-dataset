import {describe, expect, it} from 'vitest';
import {MeasurementLengthDifferenceGenerator} from './generator.ts';

describe('MeasurementLengthDifferenceGenerator', () => {
    it('keeps the typed length-difference relation coherent', () => {
        const data = new MeasurementLengthDifferenceGenerator().generate({}).data;
        expect(data.longerLength - data.shorterLength).toBe(data.difference);
        expect(data.unitId).toBe('centimeter');
        expect(data).not.toHaveProperty('lengthA');
        expect(data).not.toHaveProperty('lengthB');
    });
});
