import {Area} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {getRandomState, setSeed} from '../../lib/random.ts';
import {sampleArithmeticTriple} from './arithmetic-triple-sampling.ts';
import type {ArithmeticTripleSamplingConfig} from './arithmetic-triple-schema.ts';

const config: ArithmeticTripleSamplingConfig = {
    operation: Area.Addition, range: {min: 0, max: 100}, requireZero: false,
    requireMultipleOf10: false, useCommutativeLaw: false, useAssociativeLaw: false, useDistributiveLaw: false
};

describe('shared arithmetic triple sampler', () => {
    it.each([
        [Area.Addition, {num1: 59, num2: 18, num3: 20, answer: 97, operation: 'addition'}],
        [Area.Subtraction, {num1: 97, num2: 59, num3: 18, answer: 20, operation: 'subtraction'}],
        [Area.Multiplication, {num1: 3, num2: 3, num3: 10, answer: 90, operation: 'multiplication'}],
        [Area.Division, {num1: 90, num2: 3, num3: 3, answer: 10, operation: 'division'}]
    ] as const)('preserves the established no-law %s payload and random continuation', (operation, data) => {
        setSeed(42);
        expect(sampleArithmeticTriple({...config, operation})).toEqual({data});
        expect(getRandomState()).toBe(1199730185);
    });

    it('preserves the legacy distributive witness and random continuation', () => {
        setSeed(42);
        expect(sampleArithmeticTriple({...config, operation: Area.Multiplication, useDistributiveLaw: true}))
            .toEqual({data: {num1: 6, num2: 7, num3: 8, answer: 90, operation: 'multiplication',
                propertyLaw: 'distributive', combinedFactor: 15, partialProducts: [42, 48]}});
        expect(getRandomState()).toBe(1199730185);
    });

    it.each([
        {range: {min: 20, max: 10}},
        {requireMultipleOf10: true, range: {min: 0, max: 5}},
        {range: {min: 5, max: 10}},
        {operation: Area.Multiplication, range: {min: 5, max: 100}},
        {operation: Area.Multiplication, useDistributiveLaw: true, requireMultipleOf10: true},
        {operation: Area.Addition, useDistributiveLaw: true}
    ] as const)('retains the null result for an infeasible legacy configuration %j', overrides => {
        expect(sampleArithmeticTriple({...config, ...overrides})).toBeNull();
    });
});
