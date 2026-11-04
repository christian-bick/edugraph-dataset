import {describe, expect, it, vi} from 'vitest';
import {createCanonicalNumericRange, hasCanonicalRangeWitness} from '../../lib/canonical-numeric-range.ts';
import {getRandomState, setSeed} from '../../lib/random.ts';
import * as rng from '../../lib/random.ts';
import {WritingGenerator} from './generator.ts';
import {Area} from 'edugraph-ts';
import {nameIntegerInterval, nameRangeProfiles} from './range-profile.ts';

const digitNotation = {notationFamily: Area.DigitNotation} as const;

describe('WritingGenerator', () => {
    const generator = new WritingGenerator();

    it('should have the correct type', () => {
        expect(generator.type).toBe('writing');
    });

    it('should produce zero for every sample that requires zero', () => {
        for (let seed = 0; seed < 50; seed++) {
            setSeed(seed);
            const stub = generator.generate({...digitNotation, range: {min: 0, max: 20}, requireZero: true});
            expect(stub).not.toBeNull();
            expect(stub!.data.number).toBe(0);
        }
    });

    it('should exclude zero for every sample that does not require zero', () => {
        for (let seed = 0; seed < 50; seed++) {
            setSeed(seed);
            const stub = generator.generate({...digitNotation, range: createCanonicalNumericRange(20, 10), requireZero: false});
            expect(stub).not.toBeNull();
            expect(stub!.data.number).toBeGreaterThan(10);
            expect(stub!.data.number).toBeLessThan(20);
        }
    });

    it('stays within the canonical scalar band below120', () => {
        for (let seed = 0; seed < 100; seed++) {
            setSeed(seed);
            const stub = generator.generate({...digitNotation, range: createCanonicalNumericRange(120, 100), requireZero: false});
            expect(stub).not.toBeNull();
            expect(stub!.data.number).toBeGreaterThan(100);
            expect(stub!.data.number).toBeLessThan(120);
        }
    });

    it.each(nameRangeProfiles)('preserves native scalar endpoints and payload shape for band $range.max', ({range}) => {
        const [first, last] = nameIntegerInterval(range, false), draw = vi.spyOn(rng, 'random');
        try {
            for (const notationFamily of [Area.DigitNotation, Area.NumerationWithIntegers]) {
                for (const edge of [0, (2 ** 32 - 1) / 2 ** 32]) {
                    draw.mockClear().mockReturnValue(edge);
                    const {data} = generator.generate({notationFamily, range, requireZero: false})!;
                    expect(data.number).toBe(edge === 0 ? first : last);
                    expect(hasCanonicalRangeWitness([data.number], range)).toBe(true);
                    expect('placeValues' in data).toBe(data.number > 1000);
                    if ('placeValues' in data) {
                        expect(data.placeValues.map(place => place.value).reduce((sum, value) => sum + value, 0)).toBe(data.number);
                        expect(data.placeValues).toHaveLength(String(data.number).length);
                    }
                    expect(draw).toHaveBeenCalledTimes(1);
                }
            }
        } finally { draw.mockRestore(); }
    });

    it('uses the same neutral Grade 4 payload for every notation family', () => {
        setSeed(81);
        const numberNameData = generator.generate({
            notationFamily: Area.NumberNameNotation,
            range: createCanonicalNumericRange(10000, 1000),
            requireZero: false
        })!.data;
        setSeed(81);
        const digitData = generator.generate({
            notationFamily: Area.DigitNotation,
            range: createCanonicalNumericRange(10000, 1000),
            requireZero: false
        })!.data;

        expect(numberNameData).toEqual(digitData);
        expect('placeValues' in numberNameData
            ? numberNameData.placeValues
                .map(place => place.value)
                .reduce((sum, value) => sum + value, 0)
            : 0).toBe(numberNameData.number);

        const numerationData = generator.generate({
            notationFamily: Area.NumerationWithIntegers,
            range: createCanonicalNumericRange(10000, 1000),
            requireZero: false
        })!.data;
        expect('placeValues' in numerationData).toBe(true);
    });

    it('is deterministic for multi-digit payloads', () => {
        const config = {
            notationFamily: Area.DigitNotation,
            range: createCanonicalNumericRange(1_000_000, 100000),
            requireZero: false
        } as const;
        setSeed('writing-multi-digit');
        const first = generator.generate(config);
        setSeed('writing-multi-digit');
        expect(generator.generate(config)).toEqual(first);
    });

    it('preserves the null result for a legacy zero-incompatible range', () => {
        expect(generator.generate({...digitNotation, range: {min: 1, max: 20}, requireZero: true})).toBeNull();
    });

    it.each([{min: 5, max: 2}, {min: 120, max: 120}, {min: 1000, max: 1000},
        {min: 1_000_000, max: 1_000_000}, {min: 0, max: 120},
        {...createCanonicalNumericRange(120, 100), maximumAbove: 20},
        {...createCanonicalNumericRange(120, 100), minimumBelow: 1000}])(
        'rejects unsupported or altered positive range %j before randomness', range => {
            setSeed(42);
            const draw = vi.spyOn(rng, 'random');
            try {
                expect(() => generator.generate({...digitNotation, range, requireZero: false})).toThrow();
                expect(draw).not.toHaveBeenCalled();
                expect(getRandomState()).toBe(42);
            } finally { draw.mockRestore(); }
        });

    it('keeps one draw and fresh complete place-value evidence across replay', () => {
        const config = {...digitNotation, range: createCanonicalNumericRange(10000, 1000), requireZero: false};
        setSeed('scalar-writing');
        const first = generator.generate(config), continuation = getRandomState();
        setSeed('scalar-writing');
        const second = generator.generate(config);
        expect(second).toEqual(first);
        expect(getRandomState()).toBe(continuation);
        expect(second!.data).not.toBe(first!.data);
        expect('placeValues' in second!.data && 'placeValues' in first!.data
            && second!.data.placeValues === first!.data.placeValues).toBe(false);
        setSeed('scalar-writing');
        rng.random();
        expect(getRandomState()).toBe(continuation);
    });

    it('should strictly validate every required config field', () => {
        expect(() => generator.generate({} as any)).toThrow();
        expect(() => generator.generate({range: {min: 0, max: 20}} as any)).toThrow();
        expect(() => generator.generate({requireZero: false} as any)).toThrow();
    });
});
