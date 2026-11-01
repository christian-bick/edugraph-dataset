import {Area, Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {resolveLargestOperandDigits} from './operand-width.ts';

describe('canonical operand width resolution', () => {
    it('resolves precise widths and the nonoverlapping broad multiple-digit profile', () => {
        expect(resolveLargestOperandDigits([Scope.SingleDigitLargestOperand])).toBe(1);
        expect(resolveLargestOperandDigits([Scope.TwoDigitLargestOperand])).toBe(2);
        expect(resolveLargestOperandDigits([Scope.ThreeDigitLargestOperand])).toBe(3);
        expect(resolveLargestOperandDigits([Scope.FourDigitLargestOperand])).toBe(4);
        expect(resolveLargestOperandDigits([Scope.MultipleDigitLargestOperand])).toBe('multiple');
        expect(resolveLargestOperandDigits([Scope.MultipleDigitLargestOperand, Scope.TwoDigitLargestOperand])).toBe(2);
    });
    it('rejects ambiguous or unsupported requests', () => {
        expect(resolveLargestOperandDigits([])).toBeUndefined();
        expect(resolveLargestOperandDigits([Scope.SingleDigitLargestOperand, Scope.MultipleDigitLargestOperand])).toBeUndefined();
        expect(resolveLargestOperandDigits([Scope.TwoDigitLargestOperand, Scope.ThreeDigitLargestOperand])).toBeUndefined();
        expect(resolveLargestOperandDigits([Area.Addition, Scope.TwoDigitLargestOperand, Scope.NumbersSmaller5])).toBeUndefined();
    });
});
