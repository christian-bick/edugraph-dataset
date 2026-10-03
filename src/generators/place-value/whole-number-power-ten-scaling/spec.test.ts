import {Area, Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {generateWithLabels} from '../../../lib/utils.ts';
import {WholeNumberPowerTenScalingGenerator} from './generator.ts';
import {WholeNumberPowerTenScalingGeneratorSchema, spec} from './spec.ts';

describe('WholeNumberPowerTenScalingGenerator spec', () => {
    it('declares the Grade 5 mathematical claims and nonnegative power domain', () => {
        expect(spec.generalLabels).toEqual([
            Area.PatternRecognition,
            Area.PlaceValue,
            Area.Multiplication,
            Area.Exponentiation,
            Scope.PowersOf10,
            Scope.IntegerExponent,
            Scope.NumbersWithoutNegatives,
            Scope.Base10,
            Scope.IntegerNumbers
        ]);
        expect(WholeNumberPowerTenScalingGeneratorSchema).toEqual({});
    });

    it('resolves target labels to a canonical three-power series', () => {
        const stub = generateWithLabels(new WholeNumberPowerTenScalingGenerator(), [
            Area.PatternRecognition,
            Area.PlaceValue,
            Area.Multiplication,
            Area.Exponentiation,
            Scope.PowersOf10,
            Scope.IntegerExponent,
            Scope.NumbersWithoutNegatives,
            Scope.Base10,
            Scope.IntegerNumbers
        ])!;
        expect(stub.labels).toEqual([]);
        expect(stub.data.primarySeries.map(step => step.power.exponent)).toEqual([0, 1, 2]);
        expect(stub.data.existingZeroWitness.zeroPattern.kind).toBe('positive');
        expect(stub.data.zeroWitness.zeroPattern.kind).toBe('zero');
    });
});
