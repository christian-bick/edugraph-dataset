import {describe, expect, it} from 'vitest';
import {Scope} from 'edugraph-ts';
import {MeasurementLengthEstimationGenerator} from './generator.ts';
import {setSeed} from '../../../lib/random.ts';

describe('MeasurementLengthEstimationGenerator', () => {
    it.each([[Scope.CentimeterScale, 'cm'], [Scope.MeterScale, 'm']] as const)('generates plausible %s estimates', (label, unit) => {
        const data = new MeasurementLengthEstimationGenerator().generate({unit: label})!.data;
        expect(data.unit).toBe(unit);
        expect(data.problemLength).toBeGreaterThan(0);
    });

    it.each([
        [Scope.CentimeterScale, ['crayon', 'book']],
        [Scope.MeterScale, ['desk', 'door']]
    ] as const)('covers both familiar objects for %s', (unit, expectedObjects) => {
        const objects = new Set<string>();
        for (let seed = 0; seed < 50; seed++) {
            setSeed(seed);
            objects.add(new MeasurementLengthEstimationGenerator().generate({unit})!.data.object);
        }
        expect([...objects].sort()).toEqual([...expectedObjects].sort());
    });

    it('rejects missing and unsupported metric scales', () => {
        const generator = new MeasurementLengthEstimationGenerator();
        expect(() => generator.generate({})).toThrow();
        expect(generator.generate({unit: 'unsupported-scale'} as any)).toBeNull();
    });
});
