import {beforeEach, describe, expect, it} from 'vitest';
import {MeasurementLengthGenerator} from './generator.ts';
import {setSeed} from '../../../lib/random.ts';
import {Area, Scope} from 'edugraph-ts';
import {generateWithLabels} from '../../../lib/utils.ts';

describe('MeasurementLengthGenerator Spec Integration', () => {
    let generator: MeasurementLengthGenerator;

    beforeEach(() => {
        generator = new MeasurementLengthGenerator();
        setSeed(42);
    });

    it('should generate integer measurement problems when Scope.IntegerNumbers is requested', () => {
        for (let i = 0; i < 20; i++) {
            const stub = generateWithLabels(generator, [
                Area.Measurement,
                Scope.LengthMeasurement,
                Scope.IntegerNumbers,
                Scope.NumbersSmaller10
            ]);
            expect(stub).not.toBeNull();
            expect(stub!.data.bandLength).toBe(10);
            expect(stub!.data.useDecimals).toBe(false);
            expect(Number.isInteger(stub!.data.problemLength)).toBe(true);
            expect(stub!.data.problemLength).toBeGreaterThanOrEqual(1);
            expect(stub!.data.problemLength).toBeLessThanOrEqual(10);
        }
    });

    it('should generate decimal measurement problems when Scope.DecimalNumbers is requested', () => {
        for (let i = 0; i < 20; i++) {
            const stub = generateWithLabels(generator, [
                Area.Measurement,
                Scope.LengthMeasurement,
                Scope.DecimalNumbers,
                Scope.NumbersSmaller10
            ]);
            expect(stub).not.toBeNull();
            expect(stub!.data.bandLength).toBe(10);
            expect(stub!.data.useDecimals).toBe(true);
            
            const length = stub!.data.problemLength;
            expect(length).toBeGreaterThan(0);
            expect(length).toBeLessThanOrEqual(10);
        }
    });
});
