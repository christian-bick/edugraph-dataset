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
                        expect('task' in stub!.data).toBe(false);
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
        expect(generator.generate({
            range: {min: 2000, max: 2000},
            relation: Scope.Less,
            requireNegative: false,
            requireZero: false
        })).toBeNull();
        expect(generator.generate({
            range: {min: 1, max: 10},
            relation: 'unsupported' as never,
            requireNegative: false,
            requireZero: false
        })).toBeNull();
    });

    it.each(relations)('supplies Grade 4 place-value evidence for %s', relation => {
        for (let seed = 0; seed < 50; seed++) {
            setSeed(seed);
            const data = generator.generate({
                range: {min: 1000, max: 1_000_000},
                relation,
                requireNegative: false,
                requireZero: false
            })!.data;

            expect('task' in data && data.task).toBe('multi-digit-place-value-comparison');
            if (!('task' in data) || data.task !== 'multi-digit-place-value-comparison') continue;
            expect(data.num1).toBeGreaterThanOrEqual(1000);
            expect(data.num2).toBeGreaterThanOrEqual(1000);
            expect(data.num1).toBeLessThanOrEqual(1_000_000);
            expect(data.num2).toBeLessThanOrEqual(1_000_000);
            expect(data.comparisonEquation).toBe(
                `${data.leftNumeral} ${data.symbol} ${data.rightNumeral}`
            );
            if (relation === Scope.Equal) {
                expect(data.evidence.kind).toBe('all-equal');
                expect(data.num1).toBe(data.num2);
                expect(data.symbol).toBe('=');
            } else {
                expect(data.evidence.kind).toBe('first-difference');
                if (data.evidence.kind === 'first-difference') {
                    expect(data.evidence.leftDigit).not.toBe(data.evidence.rightDigit);
                    expect(data.evidence.leftPlaceValue)
                        .toBe(data.evidence.leftDigit * 10 ** data.evidence.exponent);
                    expect(data.evidence.rightPlaceValue)
                        .toBe(data.evidence.rightDigit * 10 ** data.evidence.exponent);
                }
            }
        }
    });

    it('includes one million and is deterministic', () => {
        const config = {
            range: {min: 1000, max: 1_000_000},
            relation: Scope.Greater,
            requireNegative: false,
            requireZero: false
        } as const;
        setSeed('comparison-grade-four');
        const first = generator.generate(config);
        setSeed('comparison-grade-four');
        expect(generator.generate(config)).toEqual(first);

        const boundary = generator.generate({
            ...config,
            range: {min: 1_000_000, max: 1_000_000},
            relation: Scope.Equal
        })!.data;
        expect(boundary).toMatchObject({
            task: 'multi-digit-place-value-comparison',
            num1: 1_000_000,
            num2: 1_000_000,
            leftNumeral: '1,000,000',
            rightNumeral: '1,000,000',
            symbol: '='
        });
    });
});
