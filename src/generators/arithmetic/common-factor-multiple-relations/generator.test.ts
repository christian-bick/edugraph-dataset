import {describe, expect, it} from 'vitest';
import {GeneratorValidationError} from '../../../lib/errors.ts';
import {setSeed} from '../../../lib/random.ts';
import type {CommonFactorMultipleProblem} from '../../../types/problems.ts';
import {buildCommonFactorMultipleProblem, CommonFactorMultipleRelationsGenerator} from './generator.ts';

const generator = new CommonFactorMultipleRelationsGenerator();
const euclideanGcd = (first: number, second: number): number => {
    while (second !== 0) [first, second] = [second, first % second];
    return first;
};
const commonMultipleOracle = (first: number, second: number): number => {
    if (first === 0 || second === 0) return 0;
    const step = Math.max(first, second);
    const divisor = Math.min(first, second);
    let candidate = step;
    while (candidate % divisor !== 0) candidate += step;
    return candidate;
};

function assertRelations(data: CommonFactorMultipleProblem): void {
    const [first, second] = data.inputs;
    const expectedGcd = euclideanGcd(first, second);
    if (first === 0 && second === 0) expect(data.gcd).toEqual({kind: 'undefined-zero-pair'});
    else {
        if (data.gcd.kind !== 'defined') throw new Error('Expected defined GCD.');
        expect(data.gcd.value).toBe(expectedGcd);
        expect(data.gcd.commonDivisors).toEqual(Array.from({length: expectedGcd}, (_, index) => index + 1).filter(divisor => expectedGcd % divisor === 0));
        const [u, v] = data.gcd.cofactors;
        expect(data.gcd.value * u).toBe(first);
        expect(data.gcd.value * v).toBe(second);
        expect(euclideanGcd(u, v)).toBe(1);
        expect(data.gcd.cofactorCommonDivisors).toEqual([1]);
    }
    expect(data.lcm.value).toBe(commonMultipleOracle(first, second));
    if (first === 0 || second === 0) {
        const expectedZeroIndices = first === 0 ? second === 0 ? [0, 1] : [0] : [1];
        expect(data.lcm).toEqual({kind: 'zero-extension', value: 0, zeroInputIndices: expectedZeroIndices, zeroProducts: [0, 0]});
        expect(first * 0).toBe(0);
        expect(second * 0).toBe(0);
    } else {
        if (data.gcd.kind !== 'defined' || data.lcm.kind !== 'positive') throw new Error('Expected positive relations.');
        const [u, v] = data.gcd.cofactors;
        expect(data.lcm.commonMultipliers).toEqual([v, u]);
        expect(data.lcm.commonProducts).toEqual([first * v, second * u]);
        expect(data.lcm.commonProducts).toEqual([data.lcm.value, data.lcm.value]);
        expect(data.lcm.value).toBe(data.gcd.value * u * v);
        expect(BigInt(data.gcd.value) * BigInt(data.lcm.value)).toBe(BigInt(first) * BigInt(second));
    }
    expect(data).not.toHaveProperty('operation');
    expect(data).not.toHaveProperty('question');
}

describe('uniform common factor/multiple exact witnesses', () => {
    it.each([
        [0, 100, 100, 0], [100, 0, 100, 0], [100, 100, 100, 100], [1, 100, 1, 100],
        [99, 100, 1, 9900], [11, 12, 1, 132], [8, 12, 4, 24], [12, 12, 12, 12],
        [0, 12, 12, 0], [12, 0, 12, 0]
    ])('proves both relations for (%i,%i)', (first, second, gcd, lcm) => {
        const data = buildCommonFactorMultipleProblem(first, second);
        expect(data.inputs).toEqual([first, second]);
        expect(data.gcd).toMatchObject({kind: 'defined', value: gcd});
        expect(data.lcm.value).toBe(lcm);
        assertRelations(data);
    });

    it('separates undefined GCD(0,0) from the published LCM zero extension', () => {
        expect(buildCommonFactorMultipleProblem(0, 0)).toEqual({
            kind: 'common-factor-multiple-relations', inputs: [0, 0], gcd: {kind: 'undefined-zero-pair'},
            lcm: {kind: 'zero-extension', value: 0, zeroInputIndices: [0, 1], zeroProducts: [0, 0]}
        });
    });

    it('preserves complete mathematical witnesses for every pair from0 through100', () => {
        for (let first = 0; first <= 100; first++) {
            for (let second = 0; second <= 100; second++) assertRelations(buildCommonFactorMultipleProblem(first, second));
        }
    });

    it('rejects invalid and noncanonical operands in either original position', () => {
        for (const invalid of [-1, -0, 0.5, 101, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1]) {
            expect(() => buildCommonFactorMultipleProblem(invalid, 12)).toThrow(GeneratorValidationError);
            expect(() => buildCommonFactorMultipleProblem(12, invalid)).toThrow(GeneratorValidationError);
        }
    });
});

describe('common factor/multiple operation domains', () => {
    it('rejects empty and unsupported operation configurations', () => {
        expect(() => generator.generate({})).toThrow(GeneratorValidationError);
        expect(() => generator.generate(null!)).toThrow(GeneratorValidationError);
        for (const operation of ['factor', '', 0, null]) expect(() => generator.generate({operation} as never)).toThrow(GeneratorValidationError);
    });

    it.each(['gcd', 'lcm'] as const)('keeps every seeded %s draw in its authored input domain', operation => {
        const features = new Set<string>();
        const maximum = operation === 'gcd' ? 100 : 12;
        for (let seed = 0; seed < 1000; seed++) {
            setSeed(seed);
            const data = generator.generate({operation}).data;
            const [first, second] = data.inputs;
            expect(first).toBeGreaterThanOrEqual(0);
            expect(second).toBeGreaterThanOrEqual(0);
            expect(Math.max(first, second)).toBeLessThanOrEqual(maximum);
            if (operation === 'gcd') expect(first !== 0 || second !== 0).toBe(true);
            if (first === second && first > 0) features.add('equal');
            if (first === 0 && second > 0) features.add('left-zero');
            if (first > 0 && second === 0) features.add('right-zero');
            if (first === 0 && second === 0) features.add('both-zero');
            if (data.gcd.kind === 'defined' && data.gcd.value === 1) features.add('coprime');
            if (data.gcd.kind === 'defined' && data.gcd.value > 1) features.add('common-factor');
            if (first === maximum || second === maximum) features.add('inclusive-boundary');
            if (first === 11 && second === 12) {
                expect(data.lcm.value).toBe(132);
                features.add('lcm-beyond-input-bound');
            }
        }
        for (const feature of ['equal', 'left-zero', 'right-zero', 'coprime', 'common-factor', 'inclusive-boundary']) expect(features.has(feature)).toBe(true);
        expect(features.has('both-zero')).toBe(operation === 'lcm');
        if (operation === 'lcm') expect(features.has('lcm-beyond-input-bound')).toBe(true);
    });

    it('replays from seed with no learner-action field or output labels', () => {
        for (const operation of ['gcd', 'lcm'] as const) {
            setSeed(417);
            const first = generator.generate({operation});
            setSeed(417);
            expect(generator.generate({operation})).toEqual(first);
            expect(Object.keys(first)).toEqual(['data']);
            expect(first.data).not.toHaveProperty('operation');
        }
    });
});
