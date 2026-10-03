import {describe, expect, it} from 'vitest';
import type {ArithmeticPairedPatternProblem} from '../../../types/problems.ts';
import {
    correspondenceExplanation,
    correspondenceStatement,
    validatePairedPattern
} from './paired-pattern-helpers.ts';

const multiplicative: ArithmeticPairedPatternProblem = {
    kind: 'paired-additive-patterns',
    first: {start: 0, rule: {kind: 'add-constant', increment: 3}, terms: [0, 3, 6, 9, 12, 15]},
    second: {start: 0, rule: {kind: 'add-constant', increment: 6}, terms: [0, 6, 12, 18, 24, 30]},
    correspondence: {kind: 'multiplicative', factor: 2}
};

const additive: ArithmeticPairedPatternProblem = {
    kind: 'paired-additive-patterns',
    first: {start: 2, rule: {kind: 'add-constant', increment: 3}, terms: [2, 5, 8, 11]},
    second: {start: 7, rule: {kind: 'add-constant', increment: 3}, terms: [7, 10, 13, 16]},
    correspondence: {kind: 'additive', difference: 5}
};

const independent: ArithmeticPairedPatternProblem = {
    kind: 'paired-additive-patterns',
    first: multiplicative.first,
    second: {start: 1, rule: {kind: 'add-constant', increment: 5}, terms: [1, 6, 11, 16, 21, 26]}
};

describe('paired-pattern mathematical evidence', () => {
    it('accepts both exact correspondence families and explains why their rules sustain them', () => {
        expect(() => validatePairedPattern('test', multiplicative, true)).not.toThrow();
        expect(() => validatePairedPattern('test', additive, true)).not.toThrow();
        expect(correspondenceStatement(multiplicative.correspondence!)).toContain('2 times Pattern A');
        expect(correspondenceExplanation(multiplicative, multiplicative.correspondence!)).toContain('2 times the first increase');
        expect(correspondenceStatement(additive.correspondence!)).toContain('5 greater than Pattern A');
        expect(correspondenceExplanation(additive, additive.correspondence!)).toContain('Both patterns add 3 each step');
    });

    it('accepts independent aligned recurrences for generation and requires a relation for interpretation', () => {
        expect(() => validatePairedPattern('test', independent, false)).not.toThrow();
        expect(() => validatePairedPattern('test', independent, true)).toThrow('requires an exact relation');
    });

    it('rejects unequal row lengths', () => {
        const data = {...multiplicative, second: {...multiplicative.second, terms: [0, 6, 12, 18]}};
        expect(() => validatePairedPattern('test', data, false)).toThrow('complete, aligned');
    });

    it('rejects a term that does not follow its row rule from the stated start', () => {
        const data = {...multiplicative, first: {...multiplicative.first, terms: [0, 3, 7, 9, 12, 15]}};
        expect(() => validatePairedPattern('test', data, false)).toThrow('complete, aligned');
    });

    it('rejects a false declared relation even when both rows follow their own rules', () => {
        const data: ArithmeticPairedPatternProblem = {
            ...multiplicative,
            second: {start: 0, rule: {kind: 'add-constant', increment: 5}, terms: [0, 5, 10, 15, 20, 25]}
        };
        expect(() => validatePairedPattern('test', data, true)).toThrow('stated correspondence');
    });

    it('rejects a false additive relation across aligned positions', () => {
        const data: ArithmeticPairedPatternProblem = {
            ...additive,
            correspondence: {kind: 'additive', difference: 4}
        };
        expect(() => validatePairedPattern('test', data, true)).toThrow('stated correspondence');
    });
});
