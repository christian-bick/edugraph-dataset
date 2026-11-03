import {describe, expect, it} from 'vitest';
import {GeneratorValidationError} from '../../lib/errors.ts';
import type {NumericalPowerExpressionSyntaxProblem} from '../../types/problems.ts';
import {buildNumericalPowerExpressionSyntaxProblem as build, isNumericalPowerExpressionSyntaxProblem as valid} from './numerical-power-syntax-helpers.ts';

const expression = (): NumericalPowerExpressionSyntaxProblem['expression'] => ({id: 'power', kind: 'power', exponent: 3,
    base: {id: 'base', kind: 'number', value: {numerator: 3, denominator: 1}, notation: {kind: 'integer', numeral: '3'}}});

describe('literal power syntax contract', () => {
    it('preserves exact supplied syntax without calculating even a very large power', () => {
        const syntax = {...expression(), exponent: Number.MAX_SAFE_INTEGER};
        const data = build(syntax);
        expect(data).toEqual({kind: 'numerical-power-expression-syntax', expression: syntax});
        expect(valid(data)).toBe(true);
        expect(valid(build({...expression(), exponent: 0}))).toBe(true);
        const fraction = {id: 'power', kind: 'power', exponent: 2,
            base: {id: 'base', kind: 'number', value: {numerator: -1, denominator: 2},
                notation: {kind: 'fraction', numerator: -2, denominator: 4}}} as const;
        expect(valid(build(fraction))).toBe(true);
    });

    it('rejects malformed identities, evaluated metadata, illegal exponents and mismatched notation', () => {
        const data = build(expression());
        const original = expression();
        const invalid = [null, [], {}, {kind: 'numerical-power-expression'}, {...data, expression: null},
            {...data, finalValue: {numerator: 27, denominator: 1}},
            {...data, expression: {...original, result: 27}},
            ...['', ' power '].map(id => ({...data, expression: {...original, id}})),
            ...[-1, -0, 0.5, Infinity, Number.MAX_SAFE_INTEGER + 1, '3'].map(exponent => ({...data, expression: {...original, exponent}})),
            {...data, expression: {...original, kind: 'binary'}},
            {...data, expression: {...original, base: null}},
            {...data, expression: {...original, base: {...original.base, id: 'power'}}},
            {...data, expression: {...original, base: {...original.base, id: ' '}}},
            {...data, expression: {...original, base: {...original.base, kind: 'group'}}},
            {...data, expression: {...original, base: {...original.base, result: 27}}},
            {...data, expression: {...original, base: {...original.base, value: {numerator: 2, denominator: 2}}}},
            {...data, expression: {...original, base: {...original.base, notation: {kind: 'integer', numeral: '4'}}}},
            {...data, expression: {...original, exponent: 0, base: {...original.base, value: {numerator: 0, denominator: 1}, notation: {kind: 'integer', numeral: '0'}}}},
            Object.defineProperty({}, 'kind', {get() { throw new Error('invalid getter'); }})];
        for (const value of invalid) expect(valid(value)).toBe(false);
        expect(() => build({...original, exponent: -1})).toThrow(GeneratorValidationError);
    });
});
