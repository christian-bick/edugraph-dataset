import {describe, expect, it} from 'vitest';
import {GeneratorValidationError} from '../../../lib/errors.ts';
import {setSeed} from '../../../lib/random.ts';
import type {RationalCoordinateAxis, SignedRational} from '../../../types/problems.ts';
import {isCoordinateLocation, isCoordinateNotation, isRationalCoordinateAxis, makeCoordinateAxis} from '../../coordinate/coordinate-helpers.ts';
import {buildRationalNumberlineValuesProblem, RationalNumberlineValuesGenerator} from './generator.ts';

const r = (numerator: number, denominator = 1): SignedRational => ({numerator, denominator});
const generator = new RationalNumberlineValuesGenerator();

describe('exact pure numberline locations', () => {
    it('matches independent integer, fractional and decimal location oracles', () => {
        const integer = buildRationalNumberlineValuesProblem(makeCoordinateAxis(r(1), -4, 4, 'integer'), 1);
        expect(integer.point).toEqual({value: r(-3), tickIndex: 1, notation: {kind: 'integer', numeral: '-3'}, sign: -1, magnitude: r(3)});
        const fraction = buildRationalNumberlineValuesProblem(makeCoordinateAxis(r(1, 4), -5, 5, 'fraction'), 2,
            {kind: 'fraction', numerator: -6, denominator: 8});
        expect(fraction.point).toEqual({value: r(-3, 4), tickIndex: 2, notation: {kind: 'fraction', numerator: -6, denominator: 8},
            sign: -1, magnitude: r(3, 4)});
        const decimal = buildRationalNumberlineValuesProblem(makeCoordinateAxis(r(1, 4), -4, 4, 'decimal', 2), 1,
            {kind: 'decimal', coefficient: -750, scale: 3, numeral: '-0.750'});
        expect(decimal.point).toEqual({value: r(-3, 4), tickIndex: 1,
            notation: {kind: 'decimal', coefficient: -750, scale: 3, numeral: '-0.750'}, sign: -1, magnitude: r(3, 4)});
        expect(decimal.axis.tickNotations[1]).toEqual({kind: 'decimal', coefficient: -75, scale: 2, numeral: '-0.75'});
    });

    it('accepts endpoints, zero, asymmetric and mixed-form axes with at least two remaining anchors', () => {
        for (const axis of [makeCoordinateAxis(r(1, 2), 0, 2, 'fraction'), makeCoordinateAxis(r(1, 2), -2, 0, 'decimal'),
            makeCoordinateAxis(r(1, 4), -3, 2, 'fraction')]) {
            for (let tickIndex = 0; tickIndex < axis.ticks.length; tickIndex++) {
                const problem = buildRationalNumberlineValuesProblem(axis, tickIndex);
                expect(problem.point.value).toEqual(axis.ticks[tickIndex]);
                expect(isCoordinateLocation(problem.point, axis)).toBe(true);
                expect(axis.ticks.length - 1).toBeGreaterThanOrEqual(2);
            }
        }
        const axis = makeCoordinateAxis(r(1, 2), 0, 2, 'fraction');
        const mixed: RationalCoordinateAxis = {...axis, tickNotations: [{kind: 'integer', numeral: '0'},
            {kind: 'decimal', coefficient: 50, scale: 2, numeral: '0.50'}, {kind: 'fraction', numerator: 2, denominator: 2}]};
        expect(buildRationalNumberlineValuesProblem(mixed, 2).point.notation).toEqual({kind: 'fraction', numerator: 2, denominator: 2});
        const ticks = Array.from({length: 13}, (_, index) => r(index));
        const wide: RationalCoordinateAxis = {minimum: r(0), maximum: r(12), step: r(1), zeroIndex: 0, ticks,
            tickNotations: ticks.map(value => ({kind: 'integer', numeral: String(value.numerator)})), stepNotation: {kind: 'integer', numeral: '1'}};
        expect(buildRationalNumberlineValuesProblem(wide, 12).point.value).toEqual(r(12));
    });

    it('rejects malformed scales and invalid locations while the generic coordinate family still accepts two ticks', () => {
        const two = makeCoordinateAxis(r(1), 0, 1, 'integer');
        expect(isRationalCoordinateAxis(two)).toBe(true);
        const three = makeCoordinateAxis(r(1), -1, 1, 'integer');
        const sparse = [...three.ticks]; delete sparse[1];
        for (const axis of [null, {}, two, {...three, ticks: sparse}, {...three, maximum: r(9)},
            {...three, tickNotations: []}, {...three, step: r(0)}]) {
            expect(() => buildRationalNumberlineValuesProblem(axis as RationalCoordinateAxis, 0)).toThrow(GeneratorValidationError);
        }
        for (const index of [-1, 3, -0, 0.5, NaN, Infinity]) {
            expect(() => buildRationalNumberlineValuesProblem(three, index)).toThrow(GeneratorValidationError);
        }
        expect(() => buildRationalNumberlineValuesProblem(three, 0, {kind: 'integer', numeral: '1'})).toThrow(GeneratorValidationError);
        const point = buildRationalNumberlineValuesProblem(three, 1).point;
        expect(point.sign).toBe(0);
        expect(Object.is(point.sign, -0)).toBe(false);
        expect(Object.is(point.value.numerator, -0)).toBe(false);
    });
});

describe('configured numberline generation', () => {
    it.each(['integer', 'fraction', 'decimal'] as const)('proves exact %s forms, all nonnegative values and strictly negative signed targets', numberKind => {
        const endpoints = new Set<string>();
        const scales = new Set<number>();
        let unreduced = false;
        for (const signDomain of ['nonnegative', 'signed'] as const) for (let seed = 0; seed < 160; seed++) {
            setSeed(seed);
            const {data} = generator.generate({numberKind, signDomain});
            const {axis, point} = data;
            expect(Object.keys(data).sort()).toEqual(['axis', 'kind', 'point']);
            expect(data.kind).toBe('rational-numberline-values');
            expect(isRationalCoordinateAxis(axis)).toBe(true);
            expect(isCoordinateLocation(point, axis)).toBe(true);
            expect(axis.ticks.length).toBeGreaterThanOrEqual(3);
            expect(axis.ticks.length).toBeLessThanOrEqual(11);
            expect(axis.ticks[axis.zeroIndex]).toEqual(r(0));
            expect(axis.tickNotations.every(form => form.kind === numberKind)).toBe(true);
            expect(point.notation.kind).toBe(numberKind);
            for (const [index, tick] of axis.ticks.entries()) {
                expect(BigInt(tick.numerator) * BigInt(axis.step.denominator)).toBe(
                    BigInt(index - axis.zeroIndex) * BigInt(axis.step.numerator) * BigInt(tick.denominator));
            }
            if (signDomain === 'nonnegative') {
                expect(axis.ticks.every(value => value.numerator >= 0)).toBe(true);
                if (point.tickIndex === 0) endpoints.add('zero');
                if (point.tickIndex === axis.ticks.length - 1) endpoints.add('maximum');
            } else {
                expect(point.value.numerator).toBeLessThan(0);
                expect(axis.minimum.numerator).toBeLessThan(0);
                expect(axis.maximum.numerator).toBeGreaterThan(0);
                if (point.tickIndex === 0) endpoints.add('minimum');
            }
            if (point.notation.kind === 'fraction') {
                expect(point.notation.denominator).toBeGreaterThan(1);
                expect(isCoordinateNotation(point.value, point.notation)).toBe(true);
                if (point.notation.denominator !== point.value.denominator) unreduced = true;
            }
            if (point.notation.kind === 'decimal') {
                scales.add(point.notation.scale);
                expect(point.notation.numeral).toMatch(/\.\d{2,3}$/);
            }
        }
        expect(endpoints).toEqual(new Set(['zero', 'maximum', 'minimum']));
        if (numberKind === 'fraction') expect(unreduced).toBe(true);
        if (numberKind === 'decimal') expect(scales).toEqual(new Set([2, 3]));
    });

    it('replays all math from the same seed and validates every required configuration field', () => {
        setSeed(73);
        const first = generator.generate({numberKind: 'decimal', signDomain: 'signed'});
        setSeed(73);
        expect(generator.generate({numberKind: 'decimal', signDomain: 'signed'})).toEqual(first);
        for (const config of [null, {}, {numberKind: 'integer'}, {signDomain: 'signed'}, {numberKind: '', signDomain: 'signed'},
            {numberKind: 'other', signDomain: 'signed'}, {numberKind: 'integer', signDomain: 'other'}]) {
            expect(() => generator.generate(config as never)).toThrow(GeneratorValidationError);
        }
    });
});
