import {Area} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {isFeasibleArithmeticProperty} from './arithmetic-property-domain.ts';
import type {ArithmeticTripleSamplingConfig} from './arithmetic-triple-schema.ts';

const base: ArithmeticTripleSamplingConfig = {
    operation: Area.Addition, range: {min: 0, max: 100}, requireZero: false,
    requireMultipleOf10: false, useCommutativeLaw: false, useAssociativeLaw: true, useDistributiveLaw: false
};

describe('arithmetic property domain', () => {
    it.each([
        {useAssociativeLaw: false},
        {useCommutativeLaw: true},
        {operation: Area.Subtraction},
        {operation: Area.Division},
        {operation: 'unsupported'},
        {useAssociativeLaw: false, useDistributiveLaw: true},
        {requireZero: true, range: {min: 1, max: 100}},
        {range: undefined},
        {range: {min: 10, max: 5}},
        {range: {min: 0.5, max: 100}},
        {range: {min: 0, max: Infinity}},
        {range: {min: NaN, max: 100}},
        {range: {min: 0, max: 1000001}},
        {range: {min: 0, max: 0}},
        {requireMultipleOf10: true, range: {min: 0, max: 5}}
    ] as const)('rejects invalid or unsupported property configuration %j', overrides => {
        expect(isFeasibleArithmeticProperty({...base, ...overrides})).toBe(false);
    });

    it.each([
        [{min: 5, max: 14}, false, false],
        [{min: 5, max: 15}, false, true],
        [{min: 0, max: 1}, true, false],
        [{min: 0, max: 2}, true, true],
        [{min: 0, max: 2}, false, false],
        [{min: 0, max: 3}, false, true]
    ] as const)('checks sum feasibility inclusively at %j with zero=%s', (range, requireZero, expected) => {
        expect(isFeasibleArithmeticProperty({...base, range, requireZero})).toBe(expected);
    });

    it.each([
        [{min: 5, max: 124}, false],
        [{min: 5, max: 125}, true],
        [{min: 10, max: 999}, false],
        [{min: 10, max: 1000}, true]
    ] as const)('checks three-factor feasibility inclusively at %j', (range, expected) => {
        expect(isFeasibleArithmeticProperty({...base, operation: Area.Multiplication, range})).toBe(expected);
    });

    it.each([
        [{min: 0, max: 1}, false],
        [{min: 0, max: 2}, true],
        [{min: 5, max: 50}, false],
        [{min: 5, max: 90}, true],
        [{min: 10, max: 1000}, false]
    ] as const)('admits only total distributive sampling domains: %j', (range, expected) => {
        expect(isFeasibleArithmeticProperty({...base, operation: Area.Multiplication,
            useAssociativeLaw: false, useDistributiveLaw: true, range})).toBe(expected);
    });

    it('rejects the legacy distributive sampler’s unsupported zero and tens profiles', () => {
        const distributive: ArithmeticTripleSamplingConfig = {...base, operation: Area.Multiplication,
            useAssociativeLaw: false, useDistributiveLaw: true};
        expect(isFeasibleArithmeticProperty({...distributive, requireZero: true})).toBe(false);
        expect(isFeasibleArithmeticProperty({...distributive, requireMultipleOf10: true})).toBe(false);
    });

    it('bounds the nonzero intermediate product even when the final product is zero', () => {
        const zeroTens: ArithmeticTripleSamplingConfig = {...base, operation: Area.Multiplication, requireZero: true, requireMultipleOf10: true};
        expect(isFeasibleArithmeticProperty({...zeroTens, range: {min: 0, max: 99}})).toBe(false);
        expect(isFeasibleArithmeticProperty({...zeroTens, range: {min: 0, max: 100}})).toBe(true);
    });

    it('requires room for a distinct operand in a commutative witness', () => {
        const commutative = {...base, useAssociativeLaw: false, useCommutativeLaw: true};
        expect(isFeasibleArithmeticProperty({...commutative, range: {min: 0, max: 3}})).toBe(false);
        expect(isFeasibleArithmeticProperty({...commutative, range: {min: 0, max: 4}})).toBe(true);
        expect(isFeasibleArithmeticProperty({...commutative, operation: Area.Multiplication, range: {min: 5, max: 125}})).toBe(false);
        expect(isFeasibleArithmeticProperty({...commutative, operation: Area.Multiplication, range: {min: 5, max: 150}})).toBe(true);
    });
});
