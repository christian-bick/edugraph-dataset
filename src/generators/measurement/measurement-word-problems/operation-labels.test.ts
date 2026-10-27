import {Area, Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {getRandomState, setSeed} from '../../../lib/random.ts';
import {normalizeSchemaChoices} from '../../../lib/schema-choices.ts';
import {arithmeticOperations, resolveDeclaredOperation} from '../../arithmetic/helpers.ts';
import {
    resolveMeasurementWordProblemOperandDigits,
    resolveMeasurementWordProblemOperation
} from './operation-labels.ts';

describe('measurement word-problem operation label resolver', () => {
    it.each([Area.Addition, Area.Subtraction, Area.Multiplication, Area.Division])(
        'preserves the existing %s configuration and one-draw entropy consumption', operation => {
            setSeed(`operation-declaration-${operation}`);
            const preceding = resolveDeclaredOperation([operation]);
            const precedingRandomState = getRandomState();
            setSeed(`operation-declaration-${operation}`);
            expect(resolveMeasurementWordProblemOperation([operation])).toBe(preceding);
            expect(getRandomState()).toEqual(precedingRandomState);
        }
    );

    it('leaves an empty operation binding unresolved without consuming entropy', () => {
        setSeed('empty-operation-binding');
        const before = getRandomState();
        expect(resolveMeasurementWordProblemOperation([])).toBeUndefined();
        expect(getRandomState()).toEqual(before);
    });

    it('rejects competing operations without consuming entropy', () => {
        setSeed('conflicting-operation-binding');
        const before = getRandomState();
        expect(() => resolveMeasurementWordProblemOperation([Area.Addition, Area.Subtraction])).toThrow();
        expect(getRandomState()).toEqual(before);
    });

    it('keeps shared arithmetic operation metadata unchanged for other generators', () => {
        const [domain] = normalizeSchemaChoices({operation: [arithmeticOperations, resolveDeclaredOperation]}, [], 'generator');
        expect(domain.alternatives.map(alternative => alternative.labels)).toEqual([
            [Area.Addition], [Area.Division], [Area.Multiplication], [Area.Subtraction]
        ]);
    });
});

describe('measurement word-problem operand-digit label resolver', () => {
    it.each([
        [[], false],
        [[Scope.SingleDigitLargestOperand], {role: 'largest', digits: 1}],
        [[Scope.TwoDigitLargestOperand], {role: 'largest', digits: 2}],
        [[Scope.SingleDigitSmallestOperand], {role: 'smallest', digits: 1}],
        [[Scope.SingleDigitDivisor], {role: 'divisor', digits: 1}]
    ])('resolves the explicit %s profile without consuming entropy', (labels, profile) => {
        setSeed('operand-width-declaration');
        const before = getRandomState();
        expect(resolveMeasurementWordProblemOperandDigits(labels as string[])).toEqual(profile);
        expect(getRandomState()).toEqual(before);
    });

    it.each([
        [Scope.SingleDigitLargestOperand, Scope.TwoDigitLargestOperand],
        [Scope.SingleDigitLargestOperand, Scope.SingleDigitSmallestOperand],
        [Scope.SingleDigitDivisor, Scope.SingleDigitSmallestOperand]
    ])('rejects conflicting digit claims %s + %s without consuming entropy', (...labels) => {
        setSeed('conflicting-width-binding');
        const before = getRandomState();
        expect(() => resolveMeasurementWordProblemOperandDigits(labels)).toThrow();
        expect(getRandomState()).toEqual(before);
    });
});
