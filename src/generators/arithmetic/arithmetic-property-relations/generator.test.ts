import {Area} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {getRandomState, setSeed} from '../../../lib/random.ts';
import type {ArithmeticPropertyProblem} from '../../../types/problems.ts';
import {ArithmeticPropertyRelationsGenerator} from './generator.ts';
import type {ArithmeticPropertyRelationsGeneratorConfig} from './spec.ts';

const profiles = [
    [Area.Addition, 'commutative'], [Area.Addition, 'associative'],
    [Area.Multiplication, 'commutative'], [Area.Multiplication, 'associative'],
    [Area.Multiplication, 'distributive']
] as const;
const config: ArithmeticPropertyRelationsGeneratorConfig = {
    operation: Area.Addition, range: {min: 0, max: 100}, requireZero: false,
    requireMultipleOf10: false, useCommutativeLaw: true, useAssociativeLaw: false, useDistributiveLaw: false
};

function verifyWitness(data: ArithmeticPropertyProblem, min: number, max: number) {
    const values = [data.num1, data.num2, data.num3, data.answer];
    if (data.propertyLaw === 'distributive') {
        expect(data.operation).toBe('multiplication');
        expect(data.combinedFactor).toBe(data.num2 + data.num3);
        expect(data.partialProducts).toEqual([data.num1 * data.num2, data.num1 * data.num3]);
        expect(data.answer).toBe(data.num1 * data.combinedFactor);
        expect(data.answer).toBe(data.partialProducts[0] + data.partialProducts[1]);
        values.push(data.combinedFactor, ...data.partialProducts);
    } else {
        expect(data.answer).toBe(data.operation === 'addition'
            ? data.num1 + data.num2 + data.num3 : data.num1 * data.num2 * data.num3);
        expect(data).not.toHaveProperty('combinedFactor');
        expect(data).not.toHaveProperty('partialProducts');
        if (data.propertyLaw === 'commutative') expect(data.num1).not.toBe(data.num3);
    }
    for (const value of values) {
        expect(Number.isSafeInteger(value)).toBe(true);
        expect(value).toBeGreaterThanOrEqual(min);
        expect(value).toBeLessThanOrEqual(max);
    }
    expect(data).not.toHaveProperty('blankPart');
    expect(data).not.toHaveProperty('prompt');
    return values;
}

describe('ArithmeticPropertyRelationsGenerator', () => {
    const generator = new ArithmeticPropertyRelationsGenerator();

    it('rejects an empty configuration', () => {
        expect(() => generator.generate({})).toThrow();
    });

    it.each(Object.keys(config))('requires the %s field', field => {
        expect(() => generator.generate({...config, [field]: undefined})).toThrow();
    });

    it.each(profiles)('produces a complete bounded %s %s witness', (operation, propertyLaw) => {
        for (const max of [5, 20, 100, 1000, 1000000]) {
            for (let seed = 0; seed < 30; seed++) {
                setSeed(seed);
                const stub = generator.generate({...config, operation, range: {min: 0, max},
                    useCommutativeLaw: propertyLaw === 'commutative',
                    useAssociativeLaw: propertyLaw === 'associative',
                    useDistributiveLaw: propertyLaw === 'distributive'});
                if (!stub) {
                    expect(propertyLaw).toBe('commutative');
                    continue;
                }
                expect(stub!.data.propertyLaw).toBe(propertyLaw);
                expect(verifyWitness(stub!.data, 0, max)).not.toContain(0);
            }
        }
    });

    it.each(profiles.filter(([, law]) => law !== 'distributive'))(
        'supports zero and tens independently for %s %s', (operation, propertyLaw) => {
            for (const requireZero of [false, true]) for (const requireMultipleOf10 of [false, true]) {
                for (let seed = 0; seed < 30; seed++) {
                    setSeed(seed);
                    const stub = generator.generate({...config, operation, requireZero, requireMultipleOf10,
                        range: {min: 0, max: 1000}, useCommutativeLaw: propertyLaw === 'commutative',
                        useAssociativeLaw: propertyLaw === 'associative'});
                    if (!stub) {
                        expect(propertyLaw).toBe('commutative');
                        expect(requireZero).toBe(false);
                        continue;
                    }
                    const values = verifyWitness(stub!.data, 0, 1000);
                    expect(values.includes(0)).toBe(requireZero);
                    if (requireMultipleOf10) expect(values.every(value => value % 10 === 0)).toBe(true);
                    if (operation === Area.Multiplication) {
                        expect(stub!.data.num1 * stub!.data.num2).toBeLessThanOrEqual(1000);
                        expect(stub!.data.num2 * stub!.data.num3).toBeLessThanOrEqual(1000);
                        expect(stub!.data.num1 * stub!.data.num3).toBeLessThanOrEqual(1000);
                    }
                }
            }
        });

    it.each(profiles)('respects a positive lower bound for %s %s', (operation, propertyLaw) => {
        for (let seed = 0; seed < 50; seed++) {
            setSeed(seed);
            const stub = generator.generate({...config, operation, range: {min: 5, max: 1000},
                useCommutativeLaw: propertyLaw === 'commutative',
                useAssociativeLaw: propertyLaw === 'associative',
                useDistributiveLaw: propertyLaw === 'distributive'});
            if (!stub) {
                expect(propertyLaw).toBe('commutative');
                continue;
            }
            verifyWitness(stub!.data, 5, 1000);
        }
    });

    it.each([
        {useCommutativeLaw: false}, {useAssociativeLaw: true},
        {useCommutativeLaw: false, useDistributiveLaw: true},
        {requireZero: true, range: {min: 5, max: 100}},
        {requireMultipleOf10: true, range: {min: 0, max: 20}},
        {range: {min: 100, max: 100}},
        {range: {min: 0, max: 3}},
        {range: {min: 0, max: Infinity}},
        {operation: Area.Multiplication, useCommutativeLaw: false, useDistributiveLaw: true, requireZero: true},
        {operation: Area.Multiplication, useCommutativeLaw: false, useDistributiveLaw: true, requireMultipleOf10: true}
    ] as const)('rejects unsupported configurations before consuming randomness: %j', overrides => {
        setSeed(7);
        expect(generator.generate({...config, ...overrides})).toBeNull();
        expect(getRandomState()).toBe(7);
    });

    it('exposes the distinct middle operand without another draw or a changed result', () => {
        setSeed(1);
        expect(generator.generate({...config, range: {min: 0, max: 5}})).toEqual({data: {
            num1: 2, num2: 2, num3: 1, answer: 5, operation: 'addition', propertyLaw: 'commutative'
        }});
        expect(getRandomState()).toBe(1199730144);
    });

    it('leaves all-equal commutative draws for deterministic pipeline retry', () => {
        setSeed(0);
        expect(generator.generate({...config, range: {min: 0, max: 5}})).toBeNull();
        expect(getRandomState()).toBe(1199730143);
    });

    it('repeats the full payload and continuation from the same seed', () => {
        setSeed('property-replay');
        const first = generator.generate(config);
        const continuation = getRandomState();
        setSeed('property-replay');
        expect(generator.generate(config)).toEqual(first);
        expect(getRandomState()).toBe(continuation);
    });
});
