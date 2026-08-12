import {describe, expect, it} from 'vitest';
import {Scope} from 'edugraph-ts';
import {MeasurementLengthEstimationGenerator} from './generator.ts';
describe('MeasurementLengthEstimationGenerator', () => {
    it.each([[Scope.CentimeterScale, 'cm'], [Scope.MeterScale, 'm']] as const)('generates plausible %s estimates', (label, unit) => {
        const data = new MeasurementLengthEstimationGenerator().generate({unit: label})!.data;
        expect(data.unit).toBe(unit);
        expect(data.problemLength).toBeGreaterThan(0);
    });
});
