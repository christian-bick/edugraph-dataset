import {Area, Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {findSchemaFallbackContractIssues} from '../../../lib/utils.ts';
import {validateSchemaChoiceContracts} from '../../../lib/schema-choices.ts';
import {operandWidthContextLabels, permitsLargestOperandWidth, resolveLargestOperandDigits,
    usesLargestOperandWidthProfiles} from './operand-width.ts';
import {ArithmeticOpsPairsGeneratorSchema} from './spec.ts';

const addition = [Area.Addition, Scope.NumbersSmaller20];
const selectedFrom = (labels: readonly string[]) => (label: string) => labels.includes(label);
const nonExcludingContext = new Set<string>([
    Area.Addition, Area.Subtraction, Area.Multiplication, Area.Division,
    Area.IteratedOperation, Scope.NumbersSmaller20, Scope.NumbersSmaller100, Scope.NumbersSmaller120,
    Scope.NumbersSmaller1000
]);

describe('Binary operand-width profile resolution', () => {
    it.each([Area.Addition, Area.Subtraction])('requires a width for the scoped %s domain', operation => {
        const labels = [operation, Scope.NumbersSmaller20];
        expect(usesLargestOperandWidthProfiles(selectedFrom(labels))).toBe(true);
        expect(resolveLargestOperandDigits(labels)).toBeUndefined();
        expect(resolveLargestOperandDigits([Scope.SingleDigitLargestOperand])).toBe(1);
        expect(resolveLargestOperandDigits([Scope.TwoDigitLargestOperand])).toBe(2);
        expect(resolveLargestOperandDigits([])).toBe(0);
        expect(() => validateSchemaChoiceContracts(ArithmeticOpsPairsGeneratorSchema)).not.toThrow();
        expect(findSchemaFallbackContractIssues(ArithmeticOpsPairsGeneratorSchema)).toEqual([]);
    });

    it.each([Scope.SingleDigitLargestOperand, Scope.TwoDigitLargestOperand])(
        'resolves the selected scoped width %s', width => {
            expect(resolveLargestOperandDigits([...addition, width]))
                .toBe(width === Scope.SingleDigitLargestOperand ? 1 : 2);
        }
    );

    it('rejects competing widths instead of hiding their conflict through deduplication', () => {
        expect(resolveLargestOperandDigits([
            ...addition, Scope.SingleDigitLargestOperand, Scope.TwoDigitLargestOperand
        ])).toBeUndefined();
    });

    it.each(operandWidthContextLabels.filter(label => !nonExcludingContext.has(label)))(
        'leaves %s outside the new profiles', label => {
            const labels = [...addition, label];
            expect(usesLargestOperandWidthProfiles(selectedFrom(labels))).toBe(false);
            expect(resolveLargestOperandDigits(labels)).toBe(0);
            expect(resolveLargestOperandDigits([...labels, Scope.TwoDigitLargestOperand])).toBeUndefined();
        }
    );

    it.each([Area.Multiplication, Area.Division])(
        'keeps %s on the existing sampler', operation => {
            expect(resolveLargestOperandDigits([operation, Scope.NumbersSmaller20])).toBe(0);
            expect(resolveLargestOperandDigits([
                operation, Scope.NumbersSmaller20, Scope.SingleDigitLargestOperand
            ])).toBeUndefined();
        }
    );

    it('includes equal-addend addition while retaining the existing iterated-subtraction behavior', () => {
        expect(resolveLargestOperandDigits([...addition, Area.IteratedOperation])).toBeUndefined();
        expect(resolveLargestOperandDigits([
            ...addition, Area.IteratedOperation, Scope.TwoDigitLargestOperand
        ])).toBe(2);
        expect(resolveLargestOperandDigits([
            Area.Subtraction, Area.IteratedOperation, Scope.NumbersSmaller20
        ])).toBe(0);
    });

    it('retains the existing within-five single-width claim', () => {
        const legacy = [Area.Subtraction, Scope.NumbersSmaller5, Scope.NumbersWithZero];
        expect(permitsLargestOperandWidth(selectedFrom(legacy), 1)).toBe(true);
        expect(permitsLargestOperandWidth(selectedFrom(legacy), 2)).toBe(false);
        expect(resolveLargestOperandDigits([...legacy, Scope.SingleDigitLargestOperand])).toBe(1);
        expect(resolveLargestOperandDigits([
            ...legacy, Scope.MultiplesOf10, Scope.SingleDigitLargestOperand
        ])).toBeUndefined();
    });
});
