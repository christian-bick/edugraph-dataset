import {Area, Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {generateWithLabels} from '../../../lib/utils.ts';
import {PowersOfTenGenerator} from './generator.ts';
import {PowersOfTenGeneratorSchema, spec} from './spec.ts';

describe('PowersOfTenGenerator spec integration', () => {
    it('declares the precise power-ten domain as invariant math', () => {
        expect(spec.generalLabels).toEqual([
            Area.Exponentiation,
            Scope.PowersOf10,
            Scope.IntegerExponent,
            Scope.NumbersWithoutNegatives,
            Scope.Base10,
            Scope.IntegerNumbers
        ]);
        expect(PowersOfTenGeneratorSchema).toEqual({});
    });

    it('generates for the Grade 5 formalization target', () => {
        const stub = generateWithLabels(new PowersOfTenGenerator(), [...spec.generalLabels]);
        expect(stub).not.toBeNull();
        expect(stub!.data.kind).toBe('power-ten-notation');
        expect(stub!.data.power.value).toBe(10 ** stub!.data.power.exponent);
    });
});
