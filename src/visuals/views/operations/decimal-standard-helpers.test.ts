import {describe, expect, it} from 'vitest';
import {buildDecimalStandardAddSubtractProblem as addSubtract} from '../../../generators/arithmetic/standard-algorithm-decimal-add-subtract/generator.ts';
import {buildDecimalStandardMultiplicationProblem as multiply} from '../../../generators/arithmetic/standard-algorithm-decimal-multiplication/generator.ts';
import {buildDecimalStandardDivisionProblem as divide} from '../../../generators/arithmetic/standard-algorithm-decimal-division/generator.ts';
import {decimalAdditionOracle, decimalAlignmentOracle, decimalBorrowOracle, decimalDivisionOracle, decimalExtensionOracle,
    decimalMultiplicationOracle, decimalSmallDivisionOracle, decimalTrailingDivisionOracle} from './decimal-standard-fixtures.ts';
import {alignedIntegerDigits, decimalDigitAt, decimalPartialDigits, isExactDecimalValue, isValidDecimalStandardAddSubtract,
    isValidDecimalStandardDivision, isValidDecimalStandardMultiplication} from './decimal-standard-helpers.ts';

describe('exact decimal standard-algorithm contracts', () => {
    it('preserves exact forms, zero precision and digit positions instead of float formatting', () => {
        expect(isExactDecimalValue({coefficient: 120, scale: 2, numeral: '1.20'})).toBe(true);
        expect(isExactDecimalValue({coefficient: 0, scale: 3, numeral: '0.000'})).toBe(true);
        expect(isExactDecimalValue({coefficient: 1, scale: 15, numeral: '0.000000000000001'})).toBe(true);
        for (const value of [{coefficient: 120, scale: 2, numeral: '1.2'}, {coefficient: 12, scale: 1, numeral: '01.2'},
            {coefficient: 1, scale: -1, numeral: '10'}, {coefficient: 1, scale: 0.5, numeral: '1'},
            {coefficient: NaN, scale: 0, numeral: 'NaN'}, {coefficient: 1000, scale: 0, numeral: '1e3'},
            {coefficient: -0, scale: 0, numeral: '0'}, {coefficient: 0, scale: 16, numeral: '0.0000000000000000'}]) expect(isExactDecimalValue(value)).toBe(false);
        expect(decimalDigitAt({coefficient: 520, scale: 2, numeral: '5.20'}, -2)).toBe(0);
        expect(decimalDigitAt({coefficient: 520, scale: 2, numeral: '5.20'}, -3)).toBeNull();
        expect(alignedIntegerDigits(23, 2, 4)).toEqual([null, 2, 3, null]);
    });

    it('checks independently specified overflow, unequal precision and zero-borrow cascades', () => {
        for (const data of [decimalAdditionOracle, decimalBorrowOracle, decimalAlignmentOracle]) expect(isValidDecimalStandardAddSubtract(data)).toBe(true);
        expect(decimalBorrowOracle.columns.map(column => column.workingValue)).toEqual([15, 9, 9, 9, 9, 0]);
        const data = decimalBorrowOracle;
        expect(isValidDecimalStandardAddSubtract({...data, columns: data.columns.map((column, index) => index === 1 ? {...column, workingValue: -1} : column)})).toBe(false);
        expect(isValidDecimalStandardAddSubtract({...data, columns: data.columns.map((column, index) => index === 2 ? {...column, regroupIn: 0} : column)})).toBe(false);
        expect(isValidDecimalStandardAddSubtract({...decimalAlignmentOracle, alignment: {...decimalAlignmentOracle.alignment, topNumeral: '5.20'}})).toBe(false);
        expect(isValidDecimalStandardAddSubtract({...data, result: {...data.result, numeral: '99.989'}})).toBe(false);
        expect(isValidDecimalStandardAddSubtract({...data, columns: data.columns.slice(0, -1)})).toBe(false);
    });

    it('checks literal multiplication carries, zero rows, sum carries and decimal padding', () => {
        const data = decimalMultiplicationOracle;
        expect(isValidDecimalStandardMultiplication(data)).toBe(true);
        expect(decimalPartialDigits(data, 1, 6)).toEqual([null, null, null, null, 0, 0]);
        expect(isValidDecimalStandardMultiplication({...data, partialRows: [data.partialRows[0], data.partialRows[2]]})).toBe(false);
        expect(isValidDecimalStandardMultiplication({...data, partialRows: data.partialRows.map((row, index) => index === 1 ? {...row, shiftPlaces: 0} : row)})).toBe(false);
        expect(isValidDecimalStandardMultiplication({...data, sumColumns: data.sumColumns.map((column, index) => index === 3 ? {...column, carryIn: 0} : column)})).toBe(false);
        expect(isValidDecimalStandardMultiplication({...data, decimalPlacement: {...data.decimalPlacement, decimalIndex: 2}})).toBe(false);
        expect(isValidDecimalStandardMultiplication({...data, decimalPlacement: {...data.decimalPlacement, paddedDigits: [6, 2, 3, 2, 0]}})).toBe(false);
        expect(isValidDecimalStandardMultiplication({...data, product: {coefficient: 6232, scale: 4, numeral: '0.6232'}})).toBe(false);
    });

    it('checks literal division normalization, early-zero continuation, extension zeros and retained precision', () => {
        for (const data of [decimalDivisionOracle, decimalExtensionOracle, decimalSmallDivisionOracle, decimalTrailingDivisionOracle]) expect(isValidDecimalStandardDivision(data)).toBe(true);
        const data = decimalDivisionOracle;
        expect(isValidDecimalStandardDivision({...data, normalization: {...data.normalization, divisor: 30}})).toBe(false);
        expect(isValidDecimalStandardDivision({...data, sourceDigits: [1, 2, 3, 4]})).toBe(false);
        expect(isValidDecimalStandardDivision({...data, steps: data.steps.slice(0, 2), quotientDigits: [4, 1], quotient: {coefficient: 41, scale: 0, numeral: '41'}})).toBe(false);
        expect(isValidDecimalStandardDivision({...data, steps: data.steps.map((step, index) => index === 2 ? {...step, quotientPlaceExponent: 0} : step)})).toBe(false);
        expect(isValidDecimalStandardDivision({...decimalExtensionOracle, steps: decimalExtensionOracle.steps.map((step, index) => index === 2 ? {...step, source: 'original'} : step)})).toBe(false);
        expect(isValidDecimalStandardDivision({...decimalTrailingDivisionOracle, quotient: {coefficient: 4, scale: 0, numeral: '4'}})).toBe(false);
    });

    it('accepts producer boundary members without canonical sampling restrictions', () => {
        for (const [top, bottom] of [['0.000', '0'], ['99999999999999.9', '0.0'], ['1.20', '1.20']]) {
            expect(isValidDecimalStandardAddSubtract(addSubtract('addition', top!, bottom!))).toBe(true);
            expect(isValidDecimalStandardAddSubtract(addSubtract('subtraction', top!, bottom!))).toBe(true);
        }
        for (const [a, b] of [['0.00', '1005.0'], ['1005.0', '0.00'], ['0.004', '0.025'], ['9007199254740991', '1']]) expect(isValidDecimalStandardMultiplication(multiply(a!, b!))).toBe(true);
        for (const [a, b] of [['0.000', '0.5'], ['1.005', '0.5'], ['1.20', '0.3'], ['1.2', '0.003'], ['9007199254740991', '1']]) expect(isValidDecimalStandardDivision(divide(a!, b!))).toBe(true);
    });
});
