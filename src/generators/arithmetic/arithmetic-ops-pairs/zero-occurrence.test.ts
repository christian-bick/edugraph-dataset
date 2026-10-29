import {Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {resolveZeroOccurrence} from './zero-occurrence.ts';

describe('binary zero-occurrence declarations', () => {
    it('preserves the existing mathematical booleans', () => {
        expect(resolveZeroOccurrence([])).toBe(false);
        expect(resolveZeroOccurrence([Scope.Numberline])).toBe(false);
        expect(resolveZeroOccurrence([Scope.NumbersWithoutZero])).toBe(false);
        expect(resolveZeroOccurrence([Scope.NumbersWithZero])).toBe(true);
        expect(resolveZeroOccurrence([Scope.Numberline, Scope.NumbersWithZero])).toBe(true);
    });

    it('rejects conflicting claims and zero absence on a requested number line', () => {
        expect(resolveZeroOccurrence([Scope.NumbersWithZero, Scope.NumbersWithoutZero])).toBeUndefined();
        expect(resolveZeroOccurrence([Scope.NumbersWithoutZero, Scope.Numberline])).toBeUndefined();
    });
});
