import {Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {getRandomState, setSeed} from '../../../lib/random.ts';
import {resolveGroupCountProfile} from './group-count-profile.ts';

describe('complete-group quantity declaration resolver', () => {
    it('selects exact quantity claims purely and rejects their contradiction', () => {
        setSeed('pure-group-count'); const before = getRandomState();
        expect(resolveGroupCountProfile([])).toBeUndefined();
        expect(resolveGroupCountProfile([Scope.NumbersWithZero])).toBe('zero');
        expect(resolveGroupCountProfile([Scope.NumbersWithoutZero])).toBe('positive');
        expect(() => resolveGroupCountProfile([Scope.NumbersWithZero, Scope.NumbersWithoutZero])).toThrow(/Ambiguous/);
        expect(getRandomState()).toBe(before);
    });

    it('rejects only the impossible positive count for a proper fractional dividend divided by an integer', () => {
        const alwaysZero = [Scope.FractionDividend, Scope.IntegerDivisor, Scope.ProperFractions];
        expect(resolveGroupCountProfile([...alwaysZero, Scope.NumbersWithZero])).toBe('zero');
        expect(resolveGroupCountProfile([...alwaysZero, Scope.NumbersWithoutZero])).toBeUndefined();
        for (const incomplete of [alwaysZero.slice(0, 2), alwaysZero.slice(1),
            [Scope.FractionDividend, Scope.IntegerDivisor, Scope.ImproperFractions]]) {
            expect(resolveGroupCountProfile([...incomplete, Scope.NumbersWithoutZero])).toBe('positive');
        }
    });
});
