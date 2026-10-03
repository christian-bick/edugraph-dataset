import {describe, expect, it} from 'vitest';
import {setSeed} from '../../../lib/random.ts';
import type {DecimalRoundingProblem} from '../../../types/problems.ts';
import {DecimalRoundingGenerator} from './generator.ts';

const generator = new DecimalRoundingGenerator();
const places = new Map([
    ['hundreds', 1_000_000],
    ['tens', 100_000],
    ['ones', 10_000],
    ['tenths', 1_000],
    ['hundredths', 100],
    ['thousandths', 10]
]);

function expectExactRounding(data: DecimalRoundingProblem): void {
    expect(data.kind).toBe('decimal-place-rounding');
    const quantum = data.roundingPlace.quantumInTenThousandths;
    expect(places.get(data.roundingPlace.name)).toBe(quantum);
    for (const value of [
        data.inputInTenThousandths,
        data.lowerCandidateInTenThousandths,
        data.upperCandidateInTenThousandths,
        data.midpointInTenThousandths,
        data.roundedInTenThousandths,
        data.distanceToLowerInTenThousandths,
        data.distanceToUpperInTenThousandths
    ]) expect(Number.isSafeInteger(value)).toBe(true);

    expect(data.inputInTenThousandths).toBeGreaterThan(0);
    expect(data.inputInTenThousandths).toBeLessThan(10_000_000);
    expect(data.inputInTenThousandths % 10_000).not.toBe(0);
    expect(data.lowerCandidateInTenThousandths).toBeGreaterThanOrEqual(0);
    expect(data.upperCandidateInTenThousandths).toBeLessThanOrEqual(10_000_000);
    expect(data.lowerCandidateInTenThousandths % quantum).toBe(0);
    expect(data.upperCandidateInTenThousandths).toBe(data.lowerCandidateInTenThousandths + quantum);
    expect(data.inputInTenThousandths).toBeGreaterThan(data.lowerCandidateInTenThousandths);
    expect(data.inputInTenThousandths).toBeLessThan(data.upperCandidateInTenThousandths);
    expect(data.midpointInTenThousandths).toBe(data.lowerCandidateInTenThousandths + quantum / 2);
    expect(data.distanceToLowerInTenThousandths)
        .toBe(data.inputInTenThousandths - data.lowerCandidateInTenThousandths);
    expect(data.distanceToUpperInTenThousandths)
        .toBe(data.upperCandidateInTenThousandths - data.inputInTenThousandths);
    expect(data.distanceToLowerInTenThousandths + data.distanceToUpperInTenThousandths).toBe(quantum);
    expect(data.direction).toBe(data.inputInTenThousandths < data.midpointInTenThousandths ? 'down' : 'up');
    expect(data.isMidpointTie).toBe(data.inputInTenThousandths === data.midpointInTenThousandths);
    expect(data.roundedInTenThousandths).toBe(data.direction === 'down'
        ? data.lowerCandidateInTenThousandths : data.upperCandidateInTenThousandths);
    if (data.isMidpointTie) expect(data.direction).toBe('up');
    expect(data).not.toHaveProperty('prompt');
    expect(data).not.toHaveProperty('blankAnswer');
}

describe('DecimalRoundingGenerator', () => {
    it('requires a configuration object', () => {
        expect(() => generator.generate(null as never)).toThrow();
    });

    it('covers all six places and exact down, up, tie, and carry cases', () => {
        const observedPlaces = new Set<string>();
        const observedDirections = new Set<string>();
        const tiePlaces = new Set<string>();
        const hundredsBands = new Set<number>();
        let wholeCarry = false;
        let fractionalCarry = false;
        let hundredsCarry = false;
        let tensCarry = false;

        for (let seed = 0; seed < 600; seed++) {
            setSeed(seed);
            const data = generator.generate({}).data;
            expectExactRounding(data);
            observedPlaces.add(data.roundingPlace.name);
            observedDirections.add(data.direction);
            if (data.isMidpointTie) tiePlaces.add(data.roundingPlace.name);
            if (data.roundingPlace.name === 'hundreds') {
                hundredsBands.add(data.lowerCandidateInTenThousandths);
                if (data.lowerCandidateInTenThousandths === 9_000_000
                    && data.upperCandidateInTenThousandths === 10_000_000
                    && data.direction === 'up') hundredsCarry = true;
            }
            if (data.roundingPlace.name === 'tens'
                && data.lowerCandidateInTenThousandths === 9_900_000
                && data.upperCandidateInTenThousandths === 10_000_000
                && data.direction === 'up') tensCarry = true;

            if (data.direction === 'up' && data.roundedInTenThousandths % 10_000 === 0) {
                if (data.roundingPlace.quantumInTenThousandths >= 10_000) wholeCarry = true;
                else fractionalCarry = true;
            }
        }

        expect(observedPlaces).toEqual(new Set(places.keys()));
        expect(observedDirections).toEqual(new Set(['down', 'up']));
        expect(tiePlaces).toEqual(new Set(['ones', 'tenths', 'hundredths', 'thousandths']));
        expect(hundredsBands.size).toBeGreaterThan(1);
        expect([...hundredsBands].some(lower => lower >= 1_000_000)).toBe(true);
        expect(wholeCarry).toBe(true);
        expect(fractionalCarry).toBe(true);
        expect(hundredsCarry).toBe(true);
        expect(tensCarry).toBe(true);
    });

    it.each([
        ['hundredths', 5],
        ['tens', 9],
        ['tenths', 10],
        ['thousandths', 30],
        ['ones', 32],
        ['hundreds', 39]
    ] as const)('keeps a %s carry visibly away from its endpoint', (place, seed) => {
        setSeed(seed);
        const data = generator.generate({}).data;
        const quantum = data.roundingPlace.quantumInTenThousandths;
        expect(data.roundingPlace.name).toBe(place);
        expect(data.direction).toBe('up');
        expect(data.upperCandidateInTenThousandths % 10_000).toBe(0);
        expect(data.roundedInTenThousandths).toBe(data.upperCandidateInTenThousandths);
        expect(data.inputInTenThousandths % 10_000).not.toBe(0);
        expect(data.distanceToUpperInTenThousandths).toBeGreaterThanOrEqual(quantum / 10);
        expect(data.distanceToUpperInTenThousandths).toBeLessThanOrEqual(quantum / 4);
    });

    it('replays the same rounding interval and result under the same seed', () => {
        setSeed('decimal-place-rounding');
        const first = generator.generate({});
        setSeed('decimal-place-rounding');
        expect(generator.generate({})).toEqual(first);
    });
});
