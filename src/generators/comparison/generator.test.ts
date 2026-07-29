import {describe, expect, it} from 'vitest';
import {Scope} from 'edugraph-ts';
import {setSeed} from '../../lib/random.ts';
import {ComparisonGenerator} from './generator.ts';

const relations = [Scope.Less, Scope.Equal, Scope.Greater] as const;

describe('ComparisonGenerator', () => {
    const generator = new ComparisonGenerator();

    it('should have the correct type', () => {
        expect(generator.type).toBe('comparison');
    });

    it('should strictly validate every required config field', () => {
        expect(() => generator.generate({} as any)).toThrow();
        expect(() => generator.generate({
            relation: Scope.Less,
            requireNegative: false,
            requireZero: false
        } as any)).toThrow();
        expect(() => generator.generate({
            range: {min: 1, max: 10},
            relation: Scope.Less,
            requireZero: false
        } as any)).toThrow();
    });

    it('should prove zero and negative scope requirements for every compatible relation and seed', () => {
        for (const relation of relations) {
            for (const requireZero of [false, true]) {
                for (const requireNegative of [false, true]) {
                    if (relation === Scope.Equal && requireZero && requireNegative) continue;

                    for (let seed = 0; seed < 25; seed++) {
                        setSeed(seed);
                        const stub = generator.generate({
                            range: {min: 1, max: 10},
                            relation,
                            requireNegative,
                            requireZero
                        });
                        expect(stub).not.toBeNull();

                        const {num1, num2, relation: resolvedRelation} = stub!.data;
                        const values = [num1, num2];
                        expect(values.includes(0)).toBe(requireZero);
                        expect(values.some(value => value < 0)).toBe(requireNegative);
                        expect(values.every(value => Math.abs(value) <= 10)).toBe(true);
                        if (resolvedRelation === 'less') expect(num1).toBeLessThan(num2);
                        if (resolvedRelation === 'greater') expect(num1).toBeGreaterThan(num2);
                        if (resolvedRelation === 'equal') expect(num1).toBe(num2);
                    }
                }
            }
        }
    });

    it('should reject an equal pair that cannot simultaneously witness zero and a negative', () => {
        expect(generator.generate({
            range: {min: 1, max: 10},
            relation: Scope.Equal,
            requireNegative: true,
            requireZero: true
        })).toBeNull();
    });
});
