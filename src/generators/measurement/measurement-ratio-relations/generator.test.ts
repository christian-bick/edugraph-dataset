import {describe, expect, it} from 'vitest';
import {setSeed} from '../../../lib/random.ts';
import {greatestCommonDivisor} from '../../ratio/helpers.ts';
import {measurementConversionPairSeeds} from '../helpers.ts';
import {MeasurementRatioRelationsGenerator} from './generator.ts';

const generator = new MeasurementRatioRelationsGenerator();

describe('MeasurementRatioRelationsGenerator', () => {
    it('requires a resolved supported mathematical range', () => {
        for (const config of [
            null, {}, {range: null}, {range: 10000}, {range: {}},
            {range: {min: -1, max: 10000}}, {range: {min: 1, max: 10000}},
            {range: {min: 0, max: 1000}}, {range: {min: 0, max: 10000.1}},
            {range: {min: 0, max: Infinity}}
        ]) {
            expect(() => generator.generate(config as never)).toThrow();
        }
    });

    it.each([10000, 100000, Number.MAX_SAFE_INTEGER])(
        'constructs symmetric exact conversion witnesses within range %s', max => {
            const bound = max === Number.MAX_SAFE_INTEGER ? 10000 : max;
            const pairs = new Set<string>();
            const dimensions = new Set<string>();
            const systems = new Set<string>();
            const numericProfiles = new Set<string>();
            const problems = new Set<string>();
            for (let seed = 0; seed < 400; seed++) {
                setSeed(seed);
                const {data} = generator.generate({range: {min: 0, max}});
                expect(data.kind).toBe('measurement-ratio-relation');
                const {units, unitEquality, quantityEquality, scaleFactor, forwardFactor, reverseFactor} = data;
                const pairId = `${units.first.id}-${units.second.id}`;
                pairs.add(pairId);
                dimensions.add(units.first.dimension);
                systems.add(`${units.first.system}-${units.second.system}`);
                expect(units.first.dimension).toBe(units.second.dimension);
                expect(units.first.name).toBe(units.first.id);
                expect(units.second.name).toBe(units.second.id);
                expect(units.first.symbol).not.toBe('');
                expect(units.second.symbol).not.toBe('');
                expect(unitEquality.first.denominator).toBe(1);
                expect(unitEquality.second.denominator).toBe(1);
                const first = unitEquality.first.numerator;
                const second = unitEquality.second.numerator;
                if (pairId === 'inch-centimeter') {
                    expect([first, second]).toEqual([50, 127]);
                    expect(forwardFactor).toEqual({numerator: 127, denominator: 50});
                    expect(reverseFactor).toEqual({numerator: 50, denominator: 127});
                    expect(units.first.system).toBe('customary');
                    expect(units.second.system).toBe('metric');
                } else {
                    const fact = measurementConversionPairSeeds[pairId as keyof typeof measurementConversionPairSeeds];
                    expect(fact).toBeDefined();
                    expect([first, second]).toEqual([1, fact.factor]);
                }
                expect(forwardFactor.numerator * first).toBe(second * forwardFactor.denominator);
                expect(reverseFactor.numerator * second).toBe(first * reverseFactor.denominator);
                expect(forwardFactor.numerator * reverseFactor.numerator)
                    .toBe(forwardFactor.denominator * reverseFactor.denominator);
                for (const [quantity, primitive] of [[quantityEquality.first, first], [quantityEquality.second, second]] as const) {
                    expect(quantity.numerator * scaleFactor.denominator)
                        .toBe(primitive * scaleFactor.numerator * quantity.denominator);
                    expect(primitive * scaleFactor.numerator).toBeLessThan(bound);
                    numericProfiles.add(quantity.denominator === 1 ? 'integer' : 'fractional');
                }
                expect(quantityEquality.second.numerator * quantityEquality.first.denominator * forwardFactor.denominator)
                    .toBe(quantityEquality.first.numerator * forwardFactor.numerator * quantityEquality.second.denominator);
                for (const value of [
                    unitEquality.first, unitEquality.second,
                    quantityEquality.first, quantityEquality.second,
                    scaleFactor, forwardFactor, reverseFactor
                ]) {
                    expect(Number.isSafeInteger(value.numerator)).toBe(true);
                    expect(Number.isSafeInteger(value.denominator)).toBe(true);
                    expect(value.numerator).toBeGreaterThan(0);
                    expect(value.denominator).toBeGreaterThan(0);
                    expect(value.numerator).toBeLessThan(bound);
                    expect(value.denominator).toBeLessThan(bound);
                    expect(greatestCommonDivisor(value.numerator, value.denominator)).toBe(1);
                }
                expect(Object.keys(data).sort()).toEqual([
                    'forwardFactor', 'kind', 'quantityEquality', 'reverseFactor', 'scaleFactor', 'unitEquality', 'units'
                ]);
                problems.add(JSON.stringify(data));
            }
            expect(pairs).toEqual(new Set([...Object.keys(measurementConversionPairSeeds), 'inch-centimeter']));
            expect(dimensions).toEqual(new Set(['length', 'mass', 'volume', 'time']));
            expect(systems).toEqual(new Set(['metric-metric', 'customary-customary', 'time-time', 'customary-metric']));
            expect(numericProfiles).toEqual(new Set(['integer', 'fractional']));
            expect(problems.size).toBeGreaterThan(200);
        }
    );

    it('makes the configured magnitude range affect sampled measurements', () => {
        let widerTerms = 0;
        let largerMeasurements = 0;
        for (let seed = 0; seed < 100; seed++) {
            setSeed(seed);
            const smaller = generator.generate({range: {min: 0, max: 10000}}).data;
            setSeed(seed);
            const larger = generator.generate({range: {min: 0, max: 100000}}).data;
            expect(larger.units).toEqual(smaller.units);
            expect(larger.unitEquality).toEqual(smaller.unitEquality);
            expect(larger.scaleFactor.numerator / larger.scaleFactor.denominator)
                .toBeGreaterThanOrEqual(smaller.scaleFactor.numerator / smaller.scaleFactor.denominator);
            if (larger.scaleFactor.numerator / larger.scaleFactor.denominator
                > smaller.scaleFactor.numerator / smaller.scaleFactor.denominator) largerMeasurements++;
            if (larger.quantityEquality.second.numerator >= 10000) widerTerms++;
        }
        expect(widerTerms).toBeGreaterThan(40);
        expect(largerMeasurements).toBeGreaterThan(90);
    });

    it('replays the same physical equalities from the same seed', () => {
        setSeed(64);
        const first = generator.generate({range: {min: 0, max: 10000}});
        setSeed(64);
        expect(generator.generate({range: {min: 0, max: 10000}})).toEqual(first);
    });

    it('never mutates the reused immutable unit facts', () => {
        const before = JSON.stringify(measurementConversionPairSeeds);
        const problem = generator.generate({range: {min: 0, max: 10000}});
        problem.data.units.first.name = 'changed';
        problem.data.unitEquality.first.numerator = 999;
        expect(JSON.stringify(measurementConversionPairSeeds)).toBe(before);
    });
});
