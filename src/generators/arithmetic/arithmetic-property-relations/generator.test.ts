import {Area} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {canonicalRangeProfiles} from '../../../lib/canonical-range-labels.ts';
import {createCanonicalNumericRange, hasCanonicalRangeWitness} from '../../../lib/canonical-numeric-range.ts';
import {getRandomState, setSeed} from '../../../lib/random.ts';
import {canSampleCanonicalTriple} from '../canonical-triple-sampling.ts';
import {operationNames} from '../helpers.ts';
import {ArithmeticPropertyRelationsGenerator} from './generator.ts';
import type {ArithmeticPropertyRelationsGeneratorConfig} from './spec.ts';

const generator = new ArithmeticPropertyRelationsGenerator();
const base = {operation: Area.Addition as const, range: createCanonicalNumericRange(20), requireZero: false,
    requireMultipleOf10: false, useCommutativeLaw: true, useAssociativeLaw: false, useDistributiveLaw: false};

describe('canonical arithmetic property relations', () => {
    it('strictly requires every mathematical configuration field', () => {
        expect(() => generator.generate({})).toThrow();
        for (const field of Object.keys(base)) expect(() => generator.generate({...base, [field]: undefined})).toThrow();
    });
    it('constructs all admitted finite law profiles with structured evidence and visible commutativity', () => {
        let count = 0;
        for (const {range} of canonicalRangeProfiles) for (const operation of [Area.Addition, Area.Multiplication] as const)
            for (const law of ['commutative', 'associative', 'distributive'])
                for (const requireZero of [false, true]) for (const requireMultipleOf10 of [false, true]) {
                    const config: ArithmeticPropertyRelationsGeneratorConfig = {...base, operation, range, requireZero, requireMultipleOf10,
                        useCommutativeLaw: law === 'commutative', useAssociativeLaw: law === 'associative', useDistributiveLaw: law === 'distributive'};
                    const feasible = !(config.useDistributiveLaw && (requireZero || requireMultipleOf10))
                        && canSampleCanonicalTriple({...config, operation: operationNames[operation], requireTwoDigitOperands: false} as Parameters<typeof canSampleCanonicalTriple>[0]);
                    if (!feasible) {setSeed(7); expect(generator.generate(config)).toBeNull(); expect(getRandomState()).toBe(7); continue;}
                    count++;
                    for (const seed of [0, 5, 99]) {
                        setSeed(seed);
                        const data = generator.generate(config)!.data;
                        const values = [data.num1, data.num2, data.num3, data.answer];
                        expect(data.propertyLaw).toBe(law);
                        if (law === 'distributive' && data.propertyLaw === 'distributive') {
                            expect(data.combinedFactor).toBe(data.num2 + data.num3);
                            expect(data.partialProducts).toEqual([data.num1 * data.num2, data.num1 * data.num3]);
                            expect(data.answer).toBe(data.partialProducts[0] + data.partialProducts[1]);
                            values.push(data.combinedFactor, ...data.partialProducts);
                        } else if (operation === Area.Multiplication) {
                            expect(data.answer).toBe(data.num1 * data.num2 * data.num3);
                            const pairProducts = [data.num1 * data.num2, data.num1 * data.num3, data.num2 * data.num3];
                            expect(pairProducts.every(value => value <= range.max)).toBe(true);
                            if (law === 'associative') values.push(...pairProducts);
                        } else expect(data.answer).toBe(data.num1 + data.num2 + data.num3);
                        expect(hasCanonicalRangeWitness(values, range)).toBe(true);
                        expect(values.every(Number.isSafeInteger)).toBe(true);
                        expect(values.includes(0)).toBe(requireZero);
                        if (requireMultipleOf10) expect(values.every(value => value % 10 === 0)).toBe(true);
                        if (law === 'commutative') {expect(data.num1).not.toBe(data.num2); expect(data.num1).not.toBe(data.num3);}
                        expect(data).not.toHaveProperty('prompt');
                        expect(data).not.toHaveProperty('blankPart');
                    }
                }
        expect(count).toBeGreaterThan(100);
    });
    it('rejects missing/conflicting laws and invalid operations without advancing the random stream', () => {
        for (const patch of [{useCommutativeLaw: false}, {useAssociativeLaw: true}, {operation: 'invalid'}]) {
            setSeed(7);
            expect(generator.generate({...base, ...patch} as ArithmeticPropertyRelationsGeneratorConfig)).toBeNull();
            expect(getRandomState()).toBe(7);
        }
    });
    it('replays the complete canonical relation and continuation', () => {
        setSeed('canonical-property'); const first = generator.generate(base); const continuation = getRandomState();
        setSeed('canonical-property'); expect(generator.generate(base)).toEqual(first); expect(getRandomState()).toBe(continuation);
    });
});
