import {describe, expect, it} from 'vitest';
import {setSeed} from '../../lib/random.ts';
import {OrderingGenerator} from './generator.ts';

describe('OrderingGenerator', () => {
    const generator = new OrderingGenerator();

    it('should have the correct type', () => {
        expect(generator.type).toBe('ordering');
    });

    it('should strictly validate every required config field', () => {
        expect(() => generator.generate({} as any)).toThrow();
        expect(() => generator.generate({requireNegative: true, requireZero: true} as any)).toThrow();
        expect(() => generator.generate({
            range: {min: 1, max: 10},
            requireZero: true
        } as any)).toThrow();
    });

    it('should prove zero and negative scope requirements for every seed', () => {
        for (const requireZero of [false, true]) {
            for (const requireNegative of [false, true]) {
                for (let seed = 0; seed < 50; seed++) {
                    setSeed(seed);
                    const stub = generator.generate({
                        requireZero,
                        requireNegative,
                        range: {min: 1, max: 10}
                    });
                    expect(stub).not.toBeNull();
                    const numbers = stub!.data.numbers;
                    expect(numbers).toHaveLength(5);
                    expect(new Set(numbers).size).toBe(5);
                    expect(numbers.includes(0)).toBe(requireZero);
                    expect(numbers.some((number: number) => number < 0)).toBe(requireNegative);
                    expect(numbers.every((number: number) => Math.abs(number) <= 10)).toBe(true);
                }
            }
        }
    });

    it('should return null when the requested range cannot supply five unique numbers', () => {
        expect(generator.generate({
            requireZero: false,
            requireNegative: false,
            range: {min: 1, max: 4}
        })).toBeNull();
    });

    it('should be deterministic with the same seed', () => {
        const config = {
            requireZero: true,
            requireNegative: true,
            range: {min: 1, max: 10}
        };
        setSeed(123);
        const first = generator.generate(config);
        setSeed(123);
        expect(generator.generate(config)).toEqual(first);
    });
});
