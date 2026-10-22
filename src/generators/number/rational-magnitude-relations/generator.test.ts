import {describe, expect, it} from 'vitest';
import {GeneratorValidationError} from '../../../lib/errors.ts';
import {setSeed} from '../../../lib/random.ts';
import type {SignedRational, SignedRationalAxis} from '../../../types/problems.ts';
import {isSignedRationalLocation, makeSignedRationalAxis} from '../signed-rational-axis-helpers.ts';
import {buildRationalMagnitudeRelationProblem, RationalMagnitudeRelationsGenerator} from './generator.ts';

const r = (numerator: number, denominator = 1): SignedRational => ({numerator, denominator});
const ticks = [r(-2), r(-3, 2), r(-1), r(-1, 2), r(0), r(1, 2), r(1), r(3, 2), r(2)];
const axis: SignedRationalAxis = {minimum: r(-2), maximum: r(2), step: r(1, 2), ticks, zeroIndex: 4};

describe('pure rational magnitude and supplied zero-distance witness', () => {
    it('distinguishes sign from exact nonnegative distance, including both endpoints and zero', () => {
        expect(buildRationalMagnitudeRelationProblem(axis, 1).distance).toEqual({fromTickIndex: 4, toTickIndex: 1, length: r(3, 2)});
        for (const index of [0, 1, 4, 5, 8]) {
            const data = buildRationalMagnitudeRelationProblem(axis, index);
            expect(data.distance.length).toEqual(r(Math.abs(ticks[index]!.numerator), ticks[index]!.denominator));
            expect(isSignedRationalLocation(data.point, axis)).toBe(true);
            expect(data.distance.length).not.toBe(data.point.magnitude);
        }
        expect(buildRationalMagnitudeRelationProblem(axis, 4)).toEqual({kind: 'rational-magnitude-relations', axis,
            point: {value: r(0), tickIndex: 4, sign: 0, magnitude: r(0)}, distance: {fromTickIndex: 4, toTickIndex: 4, length: r(0)}});
    });

    it('accepts generic asymmetric/nonpositive/nonnegative two-tick and wide frames', () => {
        for (const frame of [makeSignedRationalAxis(r(1, 4), -3, 2), makeSignedRationalAxis(r(1), 0, 1),
            makeSignedRationalAxis(r(1), -1, 0)]) for (const index of [0, frame.zeroIndex, frame.ticks.length - 1]) {
            expect(buildRationalMagnitudeRelationProblem(frame, index).distance.fromTickIndex).toBe(frame.zeroIndex);
        }
        const wideTicks = Array.from({length: 13}, (_, index) => r(index - 8));
        const wide = {minimum: r(-8), maximum: r(4), step: r(1), ticks: wideTicks, zeroIndex: 8};
        expect(buildRationalMagnitudeRelationProblem(wide, 12).distance.length).toEqual(r(4));
    });

    it('rejects invalid frame/location input rather than fabricating magnitude witnesses', () => {
        const sparse = [...ticks]; delete sparse[1];
        for (const frame of [null, {}, {...axis, ticks: sparse}, {...axis, zeroIndex: 2}]) {
            expect(() => buildRationalMagnitudeRelationProblem(frame as SignedRationalAxis, 0)).toThrow(GeneratorValidationError);
        }
        for (const index of [-1, 9, -0, NaN, 0.5]) expect(() => buildRationalMagnitudeRelationProblem(axis, index)).toThrow(GeneratorValidationError);
    });
});

describe('configured magnitude generation', () => {
    it.each(['nonnegative', 'signed'] as const)('proves the entire %s domain and exact segment length', signDomain => {
        const generator = new RationalMagnitudeRelationsGenerator();
        const seen = new Set<string>();
        for (let seed = 0; seed < 240; seed++) {
            setSeed(seed);
            const {data} = generator.generate({signDomain});
            const {axis: frame, point, distance} = data;
            expect(Object.keys(data).sort()).toEqual(['axis', 'distance', 'kind', 'point']);
            expect(distance.fromTickIndex).toBe(frame.zeroIndex);
            expect(distance.toTickIndex).toBe(point.tickIndex);
            expect(distance.length).toEqual(point.magnitude);
            expect(distance.length.numerator).toBeGreaterThanOrEqual(0);
            expect(BigInt(distance.length.numerator) * BigInt(frame.step.denominator)).toBe(
                BigInt(Math.abs(point.tickIndex - frame.zeroIndex)) * BigInt(frame.step.numerator) * BigInt(distance.length.denominator));
            expect(frame.ticks.length).toBeLessThanOrEqual(11);
            expect(frame.ticks.every(value => Math.abs(value.numerator) <= 5 * value.denominator)).toBe(true);
            if (signDomain === 'nonnegative') {
                expect(frame.ticks.every(value => value.numerator >= 0)).toBe(true);
                expect(point.value.numerator).toBeGreaterThanOrEqual(0);
                if (point.value.numerator === 0) seen.add('zero');
                if (point.tickIndex === frame.ticks.length - 1) seen.add('maximum');
            } else {
                expect(point.value.numerator).toBeLessThan(0);
                expect(frame.minimum.numerator).toBeLessThan(0);
                expect(frame.maximum.numerator).toBeGreaterThan(0);
                if (point.tickIndex === 0) seen.add('minimum');
            }
        }
        expect(seen).toEqual(new Set(signDomain === 'signed' ? ['minimum'] : ['zero', 'maximum']));
    });

    it('replays deterministic values and rejects missing or unsupported sign configuration', () => {
        const generator = new RationalMagnitudeRelationsGenerator();
        setSeed(91); const first = generator.generate({signDomain: 'nonnegative'});
        setSeed(91); expect(generator.generate({signDomain: 'nonnegative'})).toEqual(first);
        for (const config of [null, {}, {signDomain: ''}, {signDomain: 'other'}, {signDomain: 1}]) {
            expect(() => generator.generate(config as never)).toThrow(GeneratorValidationError);
        }
    });
});
