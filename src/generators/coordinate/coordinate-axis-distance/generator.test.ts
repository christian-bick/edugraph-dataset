import {describe, expect, it} from 'vitest';
import {GeneratorValidationError} from '../../../lib/errors.ts';
import {setSeed} from '../../../lib/random.ts';
import type {RationalCoordinateAxis, SignedRational} from '../../../types/problems.ts';
import {makeCoordinateAxis, makeCoordinatePoint} from '../coordinate-helpers.ts';
import {buildCoordinateAxisDistanceProblem, CoordinateAxisDistanceGenerator} from './generator.ts';

const r = (numerator: number, denominator = 1): SignedRational => ({numerator, denominator});
const exact = (value: SignedRational): bigint => BigInt(value.numerator);
const eq = (a: SignedRational, b: SignedRational) => exact(a) * BigInt(b.denominator) === exact(b) * BigInt(a.denominator);
const values = (value: unknown): SignedRational[] => {
    if (!value || typeof value !== 'object') return [];
    if ('numerator' in value && 'denominator' in value) return [value as SignedRational];
    return Object.values(value).flatMap(values);
};

describe('exact same-axis distance builder', () => {
    it('supplies 13/4 vertical separation and either signed subtraction orientation', () => {
        const ticks = [r(-2), r(-7, 4), r(-3, 2), r(-5, 4), r(-1), r(-3, 4), r(-1, 2), r(-1, 4), r(0), r(1, 4), r(1, 2), r(3, 4), r(1), r(5, 4)];
        const y: RationalCoordinateAxis = {minimum: r(-2), maximum: r(5, 4), step: r(1, 4), ticks, zeroIndex: 8,
            tickNotations: ticks.map(value => ({kind: 'fraction', ...value})), stepNotation: {kind: 'fraction', numerator: 1, denominator: 4}};
        const axes = {x: makeCoordinateAxis(r(1, 2), -4, 4, 'fraction'), y};
        const first = makeCoordinatePoint('P', axes, 1, 0);
        const second = makeCoordinatePoint('Q', axes, 1, 13);
        const data = buildCoordinateAxisDistanceProblem({axes, first, second});
        expect(data.separation).toMatchObject({varyingAxis: 'y', fixedCoordinate: r(-3, 2), fromCoordinate: r(-2), toCoordinate: r(5, 4), distance: r(13, 4)});
        expect(data.absoluteDifference).toEqual({minuend: r(5, 4), subtrahend: r(-2), difference: r(13, 4), magnitude: r(13, 4)});
        const reverse = buildCoordinateAxisDistanceProblem({axes, first: second, second: first, subtractionOrder: 'to-from'});
        expect(reverse.absoluteDifference.difference).toEqual(r(-13, 4));
        expect(reverse.absoluteDifference.magnitude).toEqual(r(13, 4));
    });

    it('accepts horizontal, zero, broad asymmetric/two-tick frames and original exact forms', () => {
        const axes = {x: makeCoordinateAxis(r(25), -2, 3, 'integer'), y: makeCoordinateAxis(r(1, 4), 0, 1, 'decimal', 3)};
        const first = makeCoordinatePoint('A', axes, 0, 0);
        const second = makeCoordinatePoint('B', axes, 5, 0);
        expect(buildCoordinateAxisDistanceProblem({axes, first, second}).separation.distance).toEqual(r(125));
        const coincident = makeCoordinatePoint('C', axes, 0, 0);
        expect(buildCoordinateAxisDistanceProblem({axes, first, second: coincident, varyingAxis: 'y'}).separation.distance).toEqual(r(0));
        const frame = {x: makeCoordinateAxis(r(1, 2), 0, 2, 'fraction'), y: makeCoordinateAxis(r(1, 4), 0, 2, 'decimal', 3)};
        const p = makeCoordinatePoint('P', frame, 1, 1, {x: {kind: 'fraction', numerator: 2, denominator: 4}, y: {kind: 'decimal', coefficient: 250, scale: 3, numeral: '0.250'}});
        const q = makeCoordinatePoint('Q', frame, 2, 1);
        const data = buildCoordinateAxisDistanceProblem({axes: frame, first: p, second: q});
        expect(data.first.x.notation).toEqual({kind: 'fraction', numerator: 2, denominator: 4});
        expect(data.first.y.notation).toEqual({kind: 'decimal', coefficient: 250, scale: 3, numeral: '0.250'});
        expect(data.separation.distance).toEqual(r(1, 2));
    });

    it('rejects malformed objects, duplicate nominal IDs and diagonal endpoints', () => {
        const axes = {x: makeCoordinateAxis(r(1), -1, 1, 'integer'), y: makeCoordinateAxis(r(1), -1, 1, 'integer')};
        const first = makeCoordinatePoint('A', axes, 0, 0);
        const second = makeCoordinatePoint('B', axes, 2, 2);
        for (const parameters of [null, [], {}, {axes, first, second}, {axes, first, second: first},
            {axes, first, second: {...second, x: {...second.x, tickIndex: 0.5}}}]) {
            expect(() => buildCoordinateAxisDistanceProblem(parameters as never)).toThrow(GeneratorValidationError);
        }
    });
});

describe('bounded coordinate-distance sampling', () => {
    it.each([20, 100, Number.MAX_SAFE_INTEGER])('proves complete exact bounds and varied directions for range%s', max => {
        const generator = new CoordinateAxisDistanceGenerator();
        const cap = max === Number.MAX_SAFE_INTEGER ? 100 : max;
        const seen = new Set<string>();
        let beyond20 = false;
        for (let seed = 0; seed < 320; seed++) {
            setSeed(seed);
            const {data} = generator.generate({range: {min: 0, max}});
            const {separation: s, absoluteDifference: difference} = data;
            seen.add(s.varyingAxis); seen.add(s.direction);
            if (s.fromCoordinate.numerator * s.toCoordinate.numerator < 0) seen.add('crossing');
            if (data.first.x.tickIndex === 0 || data.first.y.tickIndex === 0 || data.second.x.tickIndex === 0 || data.second.y.tickIndex === 0) seen.add('endpoint');
            if (data.axes.x.step.denominator > 1 || data.axes.y.step.denominator > 1) seen.add('fraction');
            for (const value of values(data)) {
                expect(BigInt(Math.abs(value.numerator)) <= BigInt(cap) * BigInt(value.denominator)).toBe(true);
                if (Math.abs(value.numerator) > 20 * value.denominator) beyond20 = true;
            }
            const expectedNumerator = exact(s.upper) * BigInt(s.lower.denominator) - exact(s.lower) * BigInt(s.upper.denominator);
            expect(expectedNumerator * BigInt(s.distance.denominator)).toBe(exact(s.distance) * BigInt(s.upper.denominator) * BigInt(s.lower.denominator));
            expect(eq(difference.magnitude, s.distance)).toBe(true);
            const dx = Number(data.axes.x.step.numerator) / data.axes.x.step.denominator;
            const dy = Number(data.axes.y.step.numerator) / data.axes.y.step.denominator;
            expect(Math.max(dx, dy) / Math.min(dx, dy)).toBeLessThanOrEqual(2);
            expect(Object.keys(data).sort()).toEqual(['absoluteDifference', 'axes', 'context', 'first', 'kind', 'second', 'separation']);
        }
        expect(seen).toEqual(new Set(['x', 'y', 'increasing', 'decreasing', 'stationary', 'crossing', 'endpoint', 'fraction']));
        expect(beyond20).toBe(cap > 20);
    });

    it('replays and rejects empty/malformed or unsupported range configuration', () => {
        const generator = new CoordinateAxisDistanceGenerator();
        setSeed(17); const first = generator.generate({range: {min: 0, max: 100}});
        setSeed(17); expect(generator.generate({range: {min: 0, max: Number.MAX_SAFE_INTEGER}})).toEqual(first);
        for (const config of [null, {}, {range: null}, {range: []}, {range: {min: 1, max: 20}}, {range: {min: -0, max: 20}},
            {range: {min: 0, max: 5}}, {range: {min: 0, max: NaN}}]) {
            expect(() => generator.generate(config as never)).toThrow(GeneratorValidationError);
        }
    });
});
