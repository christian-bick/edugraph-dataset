import {describe, expect, it} from 'vitest';
import {divisionOperandDistribution, divisionOperandProfiles, sampleDivisionOperands,
    type DivisionOperandProfile} from './operand-profiles.ts';

describe('finite conditional division operands', () => {
    it('caches immutable distributions but returns fresh mutable operands', () => {
        for (const profile of Object.keys(divisionOperandProfiles) as DivisionOperandProfile[]) {
            for (const group of ['zero', 'positive'] as const) {
                const distribution = divisionOperandDistribution(profile, group);
                expect(divisionOperandDistribution(profile, group)).toBe(distribution);
                expect(Object.isFrozen(distribution)).toBe(true);
                if (!distribution.length) continue;
                expect(distribution.every(candidate => Object.isFrozen(candidate)
                    && Object.isFrozen(candidate.dividend) && Object.isFrozen(candidate.divisor))).toBe(true);
                const first = sampleDivisionOperands(profile, group, 0);
                expect(first.dividend).toEqual(distribution[0].dividend);
                expect(first.divisor).toEqual(distribution[0].divisor);
                expect(Reflect.set(first.dividend, 'numerator', 999)).toBe(true);
                expect(Reflect.set(first.divisor, 'numerator', 999)).toBe(true);
                expect(sampleDivisionOperands(profile, group, 0)).toEqual({
                    dividend: distribution[0].dividend, divisor: distribution[0].divisor
                });
                expect(sampleDivisionOperands(profile, group, 1 - Number.EPSILON)).toEqual({
                    dividend: distribution.at(-1)!.dividend, divisor: distribution.at(-1)!.divisor
                });
            }
        }
    });

    it('rejects invalid draws and unsupported or empty profiles without inventing a fallback', () => {
        for (const draw of [-1, 1, NaN, Infinity]) {
            expect(() => sampleDivisionOperands('fraction-by-fraction-proper', 'zero', draw)).toThrow(/\[0, 1\)/);
        }
        expect(() => divisionOperandDistribution('toString' as never, 'zero')).toThrow(/supported/);
        expect(() => divisionOperandDistribution('fraction-by-fraction-proper', 'other' as never)).toThrow(/supported/);
        expect(divisionOperandDistribution('fraction-by-integer-proper', 'positive')).toEqual([]);
        expect(() => sampleDivisionOperands('fraction-by-integer-proper', 'positive', 0)).toThrow(/no common instance/);
    });
});
