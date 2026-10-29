import assert from 'node:assert/strict';
import {describe, expect, it} from 'vitest';
import {getRandomState, random, setSeed} from '../../lib/random.ts';
import {
    buildMeasurementConversionValues,
    buildUnitEquivalenceSequence,
    measurementConversionPairSeeds
} from './helpers.ts';

const pairs = Object.values(measurementConversionPairSeeds);
const integerCandidates = [200, 300, 400, 500, 600, 700, 800, 900];
const decimalCandidates = [0, 100, 200, 300, 400].flatMap(whole =>
    [1, 5, 10, 20, 25, 30, 40, 50, 60, 70, 75, 80, 90, 95, 99].map(fraction => whole + fraction));

describe('measurement conversion mathematical builders', () => {
    it.each(pairs)('builds all eight five-row integer sequences for $id', pair => {
        setSeed('sequence-custom-draw');
        const initialState = getRandomState();
        const starts = new Set<number>();
        for (let bucket = 0; bucket < 8; bucket++) {
            let draws = 0;
            const data = buildUnitEquivalenceSequence(pair, () => {
                draws++;
                return (bucket + 0.5) / 8;
            });
            expect(draws).toBe(1);
            expect(data.pair).toBe(pair);
            expect(Object.keys(data)).toEqual(['pair', 'equivalents']);
            expect(data.equivalents).toHaveLength(5);
            const start = data.equivalents[0]!.largerValue;
            starts.add(start);
            expect(data.equivalents).toEqual(Array.from({length: 5}, (_, index) => ({
                largerValue: start + index,
                smallerValue: (start + index) * pair.factor
            })));
        }
        expect(starts).toEqual(new Set([2, 3, 4, 5, 6, 7, 8, 9]));
        expect(getRandomState()).toBe(initialState);
    });

    it.each([
        [0, 2],
        [1 - Number.EPSILON, 9]
    ])('keeps the sequence draw boundary %s within the existing domain', (draw, start) => {
        const data = buildUnitEquivalenceSequence(measurementConversionPairSeeds['kilometer-meter'], () => draw);
        expect(data.equivalents[0]).toEqual({largerValue: start, smallerValue: start * 1000});
        expect(data.equivalents[4]).toEqual({largerValue: start + 4, smallerValue: (start + 4) * 1000});
    });

    describe.each([
        ['integer', integerCandidates],
        ['decimal', decimalCandidates]
    ] as const)('%s numeric equalities', (numberKind, candidates) => {
        it.each(pairs)('exhausts distinct ordered candidates and exact products for $id', pair => {
            setSeed('numeric-custom-draw');
            const initialState = getRandomState();
            const candidateSet = new Set(candidates);
            const orderedOutcomes = new Set<string>();
            for (let first = 0; first < candidates.length; first++) {
                for (let second = 0; second < candidates.length - 1; second++) {
                    const draws = [(first + 0.5) / candidates.length, (second + 0.5) / (candidates.length - 1)];
                    let used = 0;
                    const data = buildMeasurementConversionValues(pair, numberKind, () => {
                        assert.ok(used < draws.length, 'Only two candidate draws are allowed.');
                        return draws[used++]!;
                    });
                    assert.equal(used, 2);
                    assert.equal(data.pair, pair);
                    assert.deepEqual(Object.keys(data), ['pair', 'numericExamples']);
                    assert.equal(data.numericExamples.numberKind, numberKind);
                    assert.equal(data.numericExamples.equalities.length, 2);
                    const [left, right] = data.numericExamples.equalities;
                    assert.notEqual(left.largerHundredths, right.largerHundredths);
                    for (const equality of [left, right]) {
                        assert.ok(candidateSet.has(equality.largerHundredths));
                        assert.ok(Number.isSafeInteger(equality.smallerHundredths));
                        assert.equal(equality.smallerHundredths, equality.largerHundredths * pair.factor);
                        assert.ok(equality.smallerHundredths > 0 && equality.smallerHundredths <= 900000);
                        assert.equal(equality.largerHundredths % 100 === 0, numberKind === 'integer');
                        if (numberKind === 'integer') assert.equal(equality.smallerHundredths % 100, 0);
                    }
                    orderedOutcomes.add(`${left.largerHundredths},${right.largerHundredths}`);
                }
            }
            // Every input bucket maps to a different pair from the complete ordered domain.
            expect(orderedOutcomes.size).toBe(candidates.length * (candidates.length - 1));
            expect(getRandomState()).toBe(initialState);
        });

        it.each([0, 1 - Number.EPSILON])('keeps candidate draw boundary %s in its domain', boundary => {
            const data = buildMeasurementConversionValues(
                measurementConversionPairSeeds['pound-ounce'], numberKind, () => boundary);
            expect(data.numericExamples.equalities.map(equality => equality.largerHundredths))
                .toEqual(boundary === 0 ? candidates.slice(0, 2) : candidates.slice(-2).reverse());
        });
    });

    it('uses exactly one repository PRNG draw for a sequence by default', () => {
        setSeed('sequence-continuation');
        random();
        const expectedState = getRandomState();
        setSeed('sequence-continuation');
        const data = buildUnitEquivalenceSequence(measurementConversionPairSeeds['hour-minute']);
        expect(getRandomState()).toBe(expectedState);
        setSeed('sequence-continuation');
        expect(buildUnitEquivalenceSequence(measurementConversionPairSeeds['hour-minute'])).toEqual(data);
    });

    it.each(['integer', 'decimal'] as const)('uses exactly two repository PRNG draws for %s values by default', numberKind => {
        setSeed('values-continuation');
        random();
        random();
        const expectedState = getRandomState();
        setSeed('values-continuation');
        const data = buildMeasurementConversionValues(measurementConversionPairSeeds['pound-ounce'], numberKind);
        expect(getRandomState()).toBe(expectedState);
        setSeed('values-continuation');
        expect(buildMeasurementConversionValues(measurementConversionPairSeeds['pound-ounce'], numberKind)).toEqual(data);
    });
});
