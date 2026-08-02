import {describe, expect, it} from 'vitest';
import {ArithmeticProblem} from '../../../../types/problems.ts';
import {getWordProblemText, selectUnknownPart} from './helpers.ts';

describe('operations-word-problem helpers', () => {
    it('selects every binary unknown position deterministically', () => {
        const first = Array.from({length: 100}, (_, seed) => selectUnknownPart(seed, false));
        const second = Array.from({length: 100}, (_, seed) => selectUnknownPart(seed, false));

        expect(second).toEqual(first);
        expect(new Set(first)).toEqual(new Set(['num1', 'num2', 'answer']));
    });

    it('selects every three-addend unknown position deterministically', () => {
        const choices = Array.from({length: 100}, (_, seed) => selectUnknownPart(seed, true));
        expect(new Set(choices)).toEqual(new Set(['num1', 'num2', 'num3', 'answer']));
    });

    it('writes binary scenarios around the selected unknown', () => {
        const addition: ArithmeticProblem = {num1: 3, num2: 5, operation: 'addition', answer: 8};
        const subtraction: ArithmeticProblem = {num1: 9, num2: 4, operation: 'subtraction', answer: 5};

        expect(getWordProblemText(addition, 'num1')).toContain('some apples');
        expect(getWordProblemText(addition, 'num2')).toContain('getting some more');
        expect(getWordProblemText(addition, 'answer')).toContain('altogether?');
        expect(getWordProblemText(subtraction, 'num1')).toContain('did you start with?');
        expect(getWordProblemText(subtraction, 'num2')).toContain('give away?');
        expect(getWordProblemText(subtraction, 'answer')).toContain('are left?');
    });

    it('writes three-addend scenarios around each selected unknown', () => {
        const data: ArithmeticProblem = {
            num1: 3,
            num2: 5,
            num3: 7,
            operation: 'addition',
            answer: 15
        };

        expect(getWordProblemText(data, 'num1')).toContain('some red apples');
        expect(getWordProblemText(data, 'num2')).toContain('some green apples');
        expect(getWordProblemText(data, 'num3')).toContain('some yellow apples');
        expect(getWordProblemText(data, 'answer')).toContain('altogether?');
    });

    it('writes multiplication and division scenarios around each supported unknown', () => {
        const multiplication: ArithmeticProblem = {num1: 3, num2: 4, operation: 'multiplication', answer: 12};
        const division: ArithmeticProblem = {num1: 12, num2: 3, operation: 'division', answer: 4};

        for (const part of ['num1', 'num2', 'answer'] as const) {
            expect(getWordProblemText(multiplication, part)).toMatch(/group|groups/);
            expect(getWordProblemText(division, part)).toMatch(/shared|share/);
        }
    });
});
