import {Area, Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {getRandomState, setSeed} from '../../../lib/random.ts';
import {normalizeSchemaChoices} from '../../../lib/schema-choices.ts';
import {arithmeticOperations, resolveDeclaredOperation} from '../../arithmetic/helpers.ts';
import {resolveMeasurementWordProblemOperation} from './operation-labels.ts';

describe('measurement word-problem operation label resolver', () => {
    it.each([
        [Area.Addition, [Area.Addition]],
        [Area.Subtraction, [Area.Subtraction]],
        [Area.Multiplication, [Area.Multiplication]],
        [Area.Division, [Area.Division, Scope.SingleDigitDivisor]]
    ])('preserves the existing %s configuration and one-draw entropy consumption', (operation, requestedLabels) => {
        setSeed(`operation-declaration-${operation}`);
        const preceding = resolveDeclaredOperation([operation as string]);
        const precedingRandomState = getRandomState();
        setSeed(`operation-declaration-${operation}`);
        expect(resolveMeasurementWordProblemOperation(requestedLabels as string[])).toBe(preceding);
        expect(getRandomState()).toEqual(precedingRandomState);
    });

    it.each([
        ['empty', []],
        ['division only', [Area.Division]],
        ['divisor width only', [Scope.SingleDigitDivisor]]
    ])('leaves an incomplete %s binding unresolved without consuming entropy', (_, requestedLabels) => {
        setSeed('incomplete-operation-binding');
        const before = getRandomState();
        expect(resolveMeasurementWordProblemOperation(requestedLabels as string[])).toBeUndefined();
        expect(getRandomState()).toEqual(before);
    });

    it.each([
        ['competing operations', [Area.Addition, Area.Subtraction]],
        ['non-division with divisor width', [Area.Addition, Scope.SingleDigitDivisor]],
        ['division with a competing operation', [Area.Division, Area.Multiplication, Scope.SingleDigitDivisor]]
    ])('rejects %s without consuming entropy', (_, requestedLabels) => {
        setSeed('conflicting-operation-binding');
        const before = getRandomState();
        expect(() => resolveMeasurementWordProblemOperation(requestedLabels as string[])).toThrow();
        expect(getRandomState()).toEqual(before);
    });

    it('keeps shared arithmetic operation metadata unchanged for other generators', () => {
        const [domain] = normalizeSchemaChoices({operation: [arithmeticOperations, resolveDeclaredOperation]}, [], 'generator');
        expect(domain.alternatives.map(alternative => alternative.labels)).toEqual([
            [Area.Addition], [Area.Division], [Area.Multiplication], [Area.Subtraction]
        ]);
    });
});
