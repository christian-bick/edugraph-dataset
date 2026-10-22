import {describe, expect, it} from 'vitest';
import {GeneratorValidationError} from '../../../lib/errors.ts';
import {setSeed} from '../../../lib/random.ts';
import type {RationalOppositeRelationProblem, SignedRational, SignedRationalLocation} from '../../../types/problems.ts';
import {buildRationalOppositeRelationProblem, RationalOppositeRelationsGenerator, type RationalOppositeModelParameters} from './generator.ts';
import type {RationalOppositeRelationsGeneratorConfig} from './spec.ts';

const generator = new RationalOppositeRelationsGenerator();
const parameters: RationalOppositeModelParameters = {step: {numerator: 1, denominator: 2}, radiusTicks: 4,
    originalTick: -3, oppositeMagnitudeTick: 3, unequalMagnitudeTicks: [1, 3]};
const cross = (first: SignedRational, second: SignedRational): bigint =>
    BigInt(first.numerator) * BigInt(second.denominator) - BigInt(second.numerator) * BigInt(first.denominator);
const scalar = (numerator: number, denominator = 1): SignedRational => ({numerator, denominator});
const absolute = (value: bigint): bigint => value < 0n ? -value : value;

function assertCanonical(value: SignedRational): void {
    expect(Number.isSafeInteger(value.numerator)).toBe(true);
    expect(Number.isSafeInteger(value.denominator)).toBe(true);
    expect(value.denominator).toBeGreaterThan(0);
    expect(Object.is(value.numerator, -0)).toBe(false);
    let first = absolute(BigInt(value.numerator));
    let second = BigInt(value.denominator);
    while (second) [first, second] = [second, first % second];
    expect(first).toBe(1n);
}

function scalars(data: RationalOppositeRelationProblem): SignedRational[] {
    const points = [data.original, data.opposite, data.doubleOpposite, data.oppositePair.negative, data.oppositePair.positive,
        data.unequalSignedPair.negative, data.unequalSignedPair.positive];
    return [...data.axis.ticks, data.axis.minimum, data.axis.maximum, data.axis.step, ...points.flatMap(point => [point.value, point.magnitude]),
        data.zeroFixedPoint.value, data.zeroFixedPoint.opposite, data.oppositePair.commonMagnitude];
}

/** Independent integer cross-product oracles, with no imports from the producer's rational helpers. */
function assertModel(data: RationalOppositeRelationProblem): void {
    const {axis} = data;
    expect(data.kind).toBe('rational-opposite-relations');
    for (const value of scalars(data)) assertCanonical(value);
    expect(axis.ticks.length).toBeGreaterThanOrEqual(5);
    expect(axis.ticks.length).toBeLessThanOrEqual(11);
    expect(axis.ticks.length % 2).toBe(1);
    expect(axis.zeroIndex).toBe((axis.ticks.length - 1) / 2);
    expect(axis.minimum).toEqual(axis.ticks[0]);
    expect(axis.maximum).toEqual(axis.ticks[axis.ticks.length - 1]);
    expect(axis.step.numerator).toBeGreaterThan(0);
    expect(axis.ticks[axis.zeroIndex]).toEqual(scalar(0));
    expect(cross(axis.minimum, {...axis.maximum, numerator: -axis.maximum.numerator})).toBe(0n);
    for (let index = 1; index < axis.ticks.length; index++) {
        const previous = axis.ticks[index - 1]!;
        const current = axis.ticks[index]!;
        expect(cross(current, previous) * BigInt(axis.step.denominator)).toBe(
            BigInt(axis.step.numerator) * BigInt(current.denominator) * BigInt(previous.denominator));
    }
    const assertLocation = (point: SignedRationalLocation): void => {
        expect(Number.isInteger(point.tickIndex)).toBe(true);
        expect(point.tickIndex).toBeGreaterThanOrEqual(0);
        expect(point.tickIndex).toBeLessThan(axis.ticks.length);
        expect(point.value).toEqual(axis.ticks[point.tickIndex]);
        expect(point.sign).toBe(point.value.numerator < 0 ? -1 : point.value.numerator > 0 ? 1 : 0);
        expect(BigInt(point.magnitude.numerator) * BigInt(point.value.denominator)).toBe(
            absolute(BigInt(point.value.numerator)) * BigInt(point.magnitude.denominator));
    };
    for (const point of [data.original, data.opposite, data.doubleOpposite, data.oppositePair.negative, data.oppositePair.positive,
        data.unequalSignedPair.negative, data.unequalSignedPair.positive]) assertLocation(point);
    expect(cross(data.original.value, {...data.opposite.value, numerator: -data.opposite.value.numerator})).toBe(0n);
    expect(data.opposite.tickIndex + data.original.tickIndex).toBe(2 * axis.zeroIndex);
    expect(data.doubleOpposite).toEqual(data.original);
    expect(data.opposite.magnitude).toEqual(data.original.magnitude);
    expect(data.zeroFixedPoint).toEqual({value: scalar(0), opposite: scalar(0), tickIndex: axis.zeroIndex, oppositeTickIndex: axis.zeroIndex});
    expect(data.oppositePair.negative.sign).toBe(-1);
    expect(data.oppositePair.positive.sign).toBe(1);
    expect(cross(data.oppositePair.negative.value, {...data.oppositePair.positive.value,
        numerator: -data.oppositePair.positive.value.numerator})).toBe(0n);
    expect(data.oppositePair.negative.magnitude).toEqual(data.oppositePair.commonMagnitude);
    expect(data.oppositePair.positive.magnitude).toEqual(data.oppositePair.commonMagnitude);
    expect(data.unequalSignedPair.negative.sign).toBe(-1);
    expect(data.unequalSignedPair.positive.sign).toBe(1);
    expect(cross(data.unequalSignedPair.negative.magnitude, data.unequalSignedPair.positive.magnitude)).not.toBe(0n);
    expect(data.unequalSignedPair.equalMagnitude).toBe(false);
}

describe('exact opposite relation builder', () => {
    it.each([-3, 3, 0])('preserves two negations and fixed zero for original half-tick %s', originalTick => {
        const data = buildRationalOppositeRelationProblem({...parameters, originalTick});
        assertModel(data);
        expect(data.axis.ticks).toEqual([scalar(-2), scalar(-3, 2), scalar(-1), scalar(-1, 2), scalar(0),
            scalar(1, 2), scalar(1), scalar(3, 2), scalar(2)]);
        expect(data.original.tickIndex).toBe(4 + originalTick);
        expect(data.opposite.tickIndex).toBe(4 - originalTick);
        expect(cross(data.original.value, scalar(originalTick, 2))).toBe(0n);
        expect(data.oppositePair).toEqual({negative: {value: scalar(-3, 2), tickIndex: 1, sign: -1, magnitude: scalar(3, 2)},
            positive: {value: scalar(3, 2), tickIndex: 7, sign: 1, magnitude: scalar(3, 2)}, commonMagnitude: scalar(3, 2)});
        expect(data.unequalSignedPair.negative.value).toEqual(scalar(-1, 2));
        expect(data.unequalSignedPair.positive.value).toEqual(scalar(3, 2));
    });

    it.each([
        {step: scalar(1), radiusTicks: 2, originalTick: 2, oppositeMagnitudeTick: 1, unequalMagnitudeTicks: [2, 1]},
        {step: scalar(2), radiusTicks: 5, originalTick: -5, oppositeMagnitudeTick: 5, unequalMagnitudeTicks: [1, 5]},
        {step: scalar(1, 3), radiusTicks: 3, originalTick: -2, oppositeMagnitudeTick: 3, unequalMagnitudeTicks: [2, 1]}
    ] as const)('accepts minimum/maximum tick budgets and general exact rational steps: %j', model => {
        assertModel(buildRationalOppositeRelationProblem(model));
    });

    it.each([undefined, null, 'model'])('rejects absent mathematical parameters: %s', value => {
        expect(() => buildRationalOppositeRelationProblem(value as unknown as RationalOppositeModelParameters)).toThrow(GeneratorValidationError);
    });

    it.each([
        {step: undefined}, {step: scalar(0)}, {step: scalar(-1)}, {step: scalar(2, 2)}, {step: scalar(-0)},
        {step: scalar(1, 0)}, {step: scalar(Number.MAX_SAFE_INTEGER)},
        {radiusTicks: 1}, {radiusTicks: 6}, {radiusTicks: 2.5}, {radiusTicks: NaN},
        {originalTick: -5}, {originalTick: 5}, {originalTick: 0.5}, {originalTick: -0},
        {oppositeMagnitudeTick: 0}, {oppositeMagnitudeTick: 5},
        {unequalMagnitudeTicks: undefined}, {unequalMagnitudeTicks: []}, {unequalMagnitudeTicks: [1]},
        {unequalMagnitudeTicks: [1, 2, 3]}, {unequalMagnitudeTicks: [, 2]}, {unequalMagnitudeTicks: [0, 2]}, {unequalMagnitudeTicks: [1, 5]},
        {unequalMagnitudeTicks: [2, 2]}
    ])('rejects malformed step or lattice metadata: %j', change => {
        expect(() => buildRationalOppositeRelationProblem({...parameters, ...change} as unknown as RationalOppositeModelParameters))
            .toThrow(GeneratorValidationError);
    });
});

describe('configured opposite relation sampling', () => {
    it.each(['iterated-negation', 'nonzero-opposition', 'zero-fixed-point'] as const)(
        'samples the genuine %s primary domain while preserving every uniform witness', relation => {
            const signs = new Set<number>();
            const radii = new Set<number>();
            const denominators = new Set<number>();
            for (let seed = 0; seed < 250; seed++) {
                setSeed(seed);
                const data = generator.generate({relation, range: {min: 0, max: 10}}).data;
                assertModel(data);
                signs.add(data.original.sign);
                radii.add(data.axis.zeroIndex);
                for (const value of scalars(data)) denominators.add(value.denominator);
                if (relation === 'nonzero-opposition') expect(data.original.value.numerator).not.toBe(0);
                if (relation === 'zero-fixed-point') expect(data.original.value).toEqual(scalar(0));
                expect(data).not.toHaveProperty('relation');
                expect(data).not.toHaveProperty('unknown');
                expect(data).not.toHaveProperty('labels');
            }
            expect(signs).toEqual(new Set(relation === 'iterated-negation' ? [-1, 0, 1] : relation === 'nonzero-opposition' ? [-1, 1] : [0]));
            expect(radii).toEqual(new Set([2, 3, 4, 5]));
            expect(denominators).toEqual(new Set([1, 2]));
        }
    );

    it.each([5, 10, Number.MAX_SAFE_INTEGER])('constrains all displayed values/components to the genuine magnitude bound %s', maximum => {
        const cap = maximum === Number.MAX_SAFE_INTEGER ? 10 : maximum;
        const extents = new Set<number>();
        for (let seed = 0; seed < 400; seed++) {
            setSeed(seed);
            const data = generator.generate({relation: 'iterated-negation', range: {min: 0, max: maximum}}).data;
            for (const value of scalars(data)) {
                expect(absolute(BigInt(value.numerator))).toBeLessThanOrEqual(BigInt(cap) * BigInt(value.denominator));
                expect(Math.abs(value.numerator)).toBeLessThanOrEqual(cap);
                expect(value.denominator).toBeLessThanOrEqual(cap);
            }
            extents.add(data.axis.maximum.numerator / data.axis.maximum.denominator);
        }
        expect(extents.has(cap)).toBe(true);
        expect([...extents].some(value => value > 5)).toBe(cap === 10);
    });

    it('replays exact content and makes the unbounded sentinel an explicit local ten-bound draw', () => {
        setSeed(241);
        const expected = generator.generate({relation: 'iterated-negation', range: {min: 0, max: 10}});
        setSeed(241);
        expect(generator.generate({relation: 'iterated-negation', range: {min: 0, max: 10}})).toEqual(expected);
        setSeed(241);
        expect(generator.generate({relation: 'iterated-negation', range: {min: 0, max: Number.MAX_SAFE_INTEGER}})).toEqual(expected);
    });

    it.each([undefined, null, {}, {relation: 'iterated-negation'}, {range: {min: 0, max: 5}},
        {relation: null, range: {min: 0, max: 5}}, {relation: 'iterated-negation', range: []}])('rejects missing configuration: %j', config => {
        expect(() => generator.generate(config as unknown as RationalOppositeRelationsGeneratorConfig)).toThrow(GeneratorValidationError);
    });

    it.each(['opposite', 0, false])('rejects an unsupported mathematical relation: %s', relation => {
        expect(() => generator.generate({relation, range: {min: 0, max: 5}} as unknown as RationalOppositeRelationsGeneratorConfig))
            .toThrow('Unsupported mathematical relation');
    });

    it.each(['range', [0, 5], {min: -1, max: 5}, {min: 1, max: 5}, {min: -0, max: 5},
        {min: 0, max: 20}, {min: 0, max: 5.5}, {min: 0, max: NaN}, {min: 0, max: Infinity}])('rejects unsupported magnitude configuration: %j', range => {
        expect(() => generator.generate({relation: 'iterated-negation', range} as unknown as RationalOppositeRelationsGeneratorConfig))
            .toThrow('inclusive absolute bound');
    });
});
