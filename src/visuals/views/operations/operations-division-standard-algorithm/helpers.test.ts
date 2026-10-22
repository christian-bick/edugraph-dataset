import {describe, expect, it} from 'vitest';
import {buildStandardDivisionProblem} from '../../../../generators/arithmetic/standard-algorithm-division/generator.ts';
import {divisionCases} from './fixtures.ts';
import {alignedDivisionDigits, formatDivisionNumeral, isValidStandardDivision} from './helpers.ts';

describe('standard long-division witness validation and placement', () => {
    it('accepts independent three-digit divisor, zero-place and remainder oracles', () => {
        for (const data of Object.values(divisionCases)) expect(isValidStandardDivision(data)).toBe(true);
        expect(divisionCases.internalZero.quotientDigits).toEqual([1, 0, 1]);
        expect(divisionCases.successiveZeros.quotientDigits).toEqual([1, 0, 0, 1]);
        expect(divisionCases.trailingZero.remainder).toBe(50);
    });

    it('places products and remainders at their actual dividend columns', () => {
        expect(alignedDivisionDigits(125, 2, 5)).toEqual([1, 2, 5, null, null]);
        expect(alignedDivisionDigits(12, 3, 5)).toEqual([null, null, 1, 2, null]);
        expect(alignedDivisionDigits(0, 3, 5)).toEqual([null, null, null, 0, null]);
        expect(alignedDivisionDigits(125, 4, 5)).toEqual([null, null, 1, 2, 5]);
        expect(formatDivisionNumeral(82417)).toBe('82,417');
    });

    it('rejects lost zeros, incorrect arithmetic and false bring-down provenance', () => {
        const data = divisionCases.internalZero;
        const changed = (index: number, fields: object) => ({...data,
            steps: data.steps.map((step, i) => i === index ? {...step, ...fields} : step)});
        expect(isValidStandardDivision({...data, steps: [data.steps[0], data.steps[2]]})).toBe(false);
        expect(isValidStandardDivision({...data, quotientDigits: [1, 1]})).toBe(false);
        expect(isValidStandardDivision(changed(1, {product: 125}))).toBe(false);
        expect(isValidStandardDivision(changed(1, {remainder: 125}))).toBe(false);
        expect(isValidStandardDivision(changed(1, {previousRemainder: 0}))).toBe(false);
        expect(isValidStandardDivision(changed(1, {broughtDownDigits: [5]}))).toBe(false);
        expect(isValidStandardDivision(changed(1, {placeValue: 1}))).toBe(false);
        expect(isValidStandardDivision(changed(0, {nextBringDown: {sourceColumn: 4, digit: 2, partialDividend: 12}}))).toBe(false);
        expect(isValidStandardDivision(changed(2, {nextBringDown: {sourceColumn: 5, digit: 0, partialDividend: 0}}))).toBe(false);
        expect(isValidStandardDivision({...data, quotient: 100})).toBe(false);
        expect(isValidStandardDivision({...data, remainder: 1})).toBe(false);
    });

    it('rejects malformed values, noncanonical digit arrays and a nonminimal initial prefix', () => {
        const data = divisionCases.internalZero;
        for (const malformed of [null, {}, {...data, divisor: 0}, {...data, dividend: 9}, {...data, base: 2},
            {...data, dividendDigits: [0, ...data.dividendDigits]}, {...data, quotientDigits: [0, 1, 0, 1]},
            {...data, steps: [null]}, {...data, quotientStartColumn: 1}, {...data, divisor: NaN},
            {...data, dividend: Number.MAX_SAFE_INTEGER + 1}]) expect(isValidStandardDivision(malformed)).toBe(false);
        const delayedPrefix = buildStandardDivisionProblem(120, 12);
        expect(isValidStandardDivision({...delayedPrefix, quotientStartColumn: 2,
            quotientDigits: [1], steps: [{...delayedPrefix.steps[0]!, columnIndex: 2, broughtDownDigits: [1, 2, 0]}]})).toBe(false);
    });

    it('accepts absent optional transition metadata and the complete safe-integer contract', () => {
        const data = divisionCases.internalZero;
        const steps = data.steps.map(({nextBringDown: _, ...step}) => step);
        expect(isValidStandardDivision({...data, steps})).toBe(true);
        for (const [dividend, divisor] of [[10, 1], [99999, 999], [Number.MAX_SAFE_INTEGER, 1],
            [Number.MAX_SAFE_INTEGER, Number.MAX_SAFE_INTEGER], [10, Number.MAX_SAFE_INTEGER]]) {
            expect(isValidStandardDivision(buildStandardDivisionProblem(dividend!, divisor!))).toBe(true);
        }
    });
});
