import {afterEach, describe, expect, it, vi} from 'vitest';
import {GeneratorValidationError} from '../../../lib/errors.ts';
import * as rng from '../../../lib/random.ts';
import {createCanonicalNumericRange, hasCanonicalRangeWitness} from '../../../lib/canonical-numeric-range.ts';
import {commonRelationDomain} from './domain.ts';
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

const completeWitnessPartitions = Array.from({length: 11}, (_, index) => ({
    firstMinimum: index * 10, firstMaximum: Math.min(100, index * 10 + 9)
}));

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

    it.each(completeWitnessPartitions)('preserves complete mathematical witnesses for first operands $firstMinimum through $firstMaximum', ({firstMinimum, firstMaximum}) => {
        for (let first = firstMinimum; first <= firstMaximum; first++) {
            for (let second = 0; second <= 100; second++) assertRelations(buildCommonFactorMultipleProblem(first, second));
        }
    });

    it('partitions every first operand from0 through100 and all10201 ordered witness pairs', () => {
        expect(completeWitnessPartitions).toHaveLength(11);
        expect(completeWitnessPartitions.flatMap(({firstMinimum, firstMaximum}) =>
            Array.from({length: firstMaximum - firstMinimum + 1}, (_, index) => firstMinimum + index)))
            .toEqual(Array.from({length: 101}, (_, index) => index));
        expect(completeWitnessPartitions.reduce((sum, {firstMinimum, firstMaximum}) =>
            sum + (firstMaximum - firstMinimum + 1) * 101, 0)).toBe(10201);
    });

    it('rejects invalid and noncanonical operands in either original position', () => {
        for (const invalid of [-1, -0, 0.5, 101, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1]) {
            expect(() => buildCommonFactorMultipleProblem(invalid, 12)).toThrow(GeneratorValidationError);
            expect(() => buildCommonFactorMultipleProblem(12, invalid)).toThrow(GeneratorValidationError);
        }
    });
});

afterEach(() => vi.restoreAllMocks());

const commonNativePartitions = (['gcd', 'lcm'] as const).flatMap(operation => {
    const maximum = operation === 'gcd' ? 100 : 12;
    return Array.from({length: Math.ceil((maximum + 1) / 10)}, (_, index) => ({
        operation, maximum, firstMinimum: index * 10, firstMaximum: Math.min(maximum, index * 10 + 9)
    }));
});

describe('common factor/multiple canonical operation domains', () => {
    it.each(commonNativePartitions)('retains $operation first operands $firstMinimum through $firstMaximum exactly once with original full-band tickets',
        ({operation, maximum, firstMinimum, firstMaximum}) => {
            const random = vi.spyOn(rng, 'random');
            const covered = new Set<string>();
            const uppers = operation === 'gcd' ? [5, 10, 20, 100] : [5, 10, 20, 100, 120, 1000];
            for (const upper of uppers) {
                const range = createCanonicalNumericRange(upper);
                const candidates = commonRelationDomain({operation, range});
                const total = candidates.reduce((sum, candidate) => sum + candidate.weight, 0);
                let cumulative = 0;
                for (const candidate of candidates) {
                    const ticket = (cumulative + candidate.weight / 2) / total;
                    cumulative += candidate.weight;
                    // Keep the original full-domain inverse-CDF position. The
                    // test partition never renormalizes the mathematical law.
                    if (candidate.inputs[0] < firstMinimum || candidate.inputs[0] > firstMaximum) continue;
                    random.mockReset().mockReturnValue(ticket);
                    const {data} = generator.generate({profile: {operation, range}});
                    expect(random).toHaveBeenCalledTimes(1);
                    expect(data.inputs).toEqual(candidate.inputs);
                    const [first, second] = data.inputs;
                    const values = operation === 'gcd' && data.gcd.kind === 'defined'
                        ? [...data.inputs, data.gcd.value, ...data.gcd.commonDivisors, ...data.gcd.cofactors]
                        : data.lcm.kind === 'zero-extension' ? [...data.inputs, data.lcm.value, ...data.lcm.zeroProducts]
                            : data.gcd.kind === 'defined' && data.lcm.kind === 'positive'
                                ? [...data.inputs, data.gcd.value, ...data.gcd.cofactors, ...data.gcd.cofactorCommonDivisors,
                                    data.lcm.value, ...data.lcm.commonMultipliers, ...data.lcm.commonProducts] : [];
                    expect(hasCanonicalRangeWitness(values, range)).toBe(true);
                    expect(data).not.toHaveProperty('operation');
                    const key = first + ':' + second;
                    expect(covered.has(key)).toBe(false);
                    covered.add(key);
                }
            }
            const original = new Set<string>();
            for (let first = firstMinimum; first <= firstMaximum; first++) for (let second = 0; second <= maximum; second++) {
                if (operation === 'lcm' || first !== 0 || second !== 0) original.add(first + ':' + second);
            }
            expect(covered).toEqual(original);
            expect(covered.size).toBe((firstMaximum - firstMinimum + 1) * (maximum + 1)
                - Number(operation === 'gcd' && firstMinimum === 0));
        });

    it.each(['gcd', 'lcm'] as const)('covers the complete original %s first-operand partition and total', operation => {
        const maximum = operation === 'gcd' ? 100 : 12;
        const partitions = commonNativePartitions.filter(partition => partition.operation === operation);
        expect(partitions.flatMap(({firstMinimum, firstMaximum}) =>
            Array.from({length: firstMaximum - firstMinimum + 1}, (_, index) => firstMinimum + index)))
            .toEqual(Array.from({length: maximum + 1}, (_, index) => index));
        const total = partitions.reduce((sum, {firstMinimum, firstMaximum}) => sum
            + (firstMaximum - firstMinimum + 1) * (maximum + 1) - Number(operation === 'gcd' && firstMinimum === 0), 0);
        expect(total).toBe(operation === 'gcd' ? 10200 : 169);
    });

    it('rejects malformed profiles before drawing randomness', () => {
        const random = vi.spyOn(rng, 'random');
        for (const config of [undefined, {}, {profile: {}},
            {profile: {operation: 'factor', range: createCanonicalNumericRange(100)}},
            {profile: {operation: 'gcd', range: createCanonicalNumericRange(1000)}},
            {profile: {operation: 'gcd', range: createCanonicalNumericRange(100, 5)}},
            {profile: {operation: 'lcm', range: {min: 0, max: 100}}}]) {
            expect(() => generator.generate(config as never)).toThrow(GeneratorValidationError);
        }
        expect(random).not.toHaveBeenCalled();
    });

    it('replays from seed and preserves independent complete payload objects', () => {
        for (const operation of ['gcd', 'lcm'] as const) {
            const config = {profile: {operation, range: createCanonicalNumericRange(100)}};
            rng.setSeed(417);
            const first = generator.generate(config);
            const expected = structuredClone(first);
            const continuation = rng.getRandomState();
            if (first.data.gcd.kind === 'defined') (first.data.gcd.commonDivisors as number[]).push(999);
            rng.setSeed(417);
            expect(generator.generate(config)).toEqual(expected);
            expect(rng.getRandomState()).toBe(continuation);
            expect(Object.keys(first)).toEqual(['data']);
        }
    });
});
