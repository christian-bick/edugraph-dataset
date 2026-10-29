import {Area, Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {getRandomState, setSeed} from '../../lib/random.ts';
import {extractConfig, findSchemaFallbackContractIssues} from '../../lib/utils.ts';
import {hasStaticResolution} from '../../lib/static-resolvers.ts';
import {WritingGenerator} from './generator.ts';
import {spec, WritingGeneratorSchema} from './spec.ts';
import {hasWritingZero, resolveWritingZero, writingProfileCount, writingProfileValue} from './zero-profile.ts';

describe('writing coefficient-zero profiles', () => {
    it('counts the complete original million-value support exactly', () => {
        let zero = 0;
        for (let value = 1; value <= 1_000_000; value++) if (hasWritingZero(value)) zero++;
        expect(writingProfileCount(1, 1_000_000, true)).toBe(zero);
        expect(writingProfileCount(1, 1_000_000, false)).toBe(1_000_000 - zero);
        expect(zero).toBe(401_949);
        expect(writingProfileCount(5, 2, true)).toBe(0);
    });

    it('inverts every eligible rank, including singleton and inclusive boundaries', () => {
        for (const [minimum, maximum] of [[0, 20], [990, 1200], [9990, 10100], [999900, 1_000_000],
            [1000, 1000], [1001, 1001], [1111, 1111], [1000.2, 1010.8]]) {
            for (const zero of [false, true]) {
                const lower = Math.max(0, Math.ceil(minimum!));
                const values = Array.from({length: Math.max(0, Math.floor(maximum!) - lower + 1)},
                    (_, index) => lower + index).filter(value => hasWritingZero(value) === zero);
                expect(writingProfileCount(minimum!, maximum!, zero)).toBe(values.length);
                for (const [rank, value] of values.entries()) {
                    expect(writingProfileValue(minimum!, maximum!, zero, rank)).toBe(value);
                }
                expect(writingProfileValue(minimum!, maximum!, zero, values.length)).toBeNull();
                expect(writingProfileValue(minimum!, maximum!, zero, -1)).toBeNull();
                expect(writingProfileValue(minimum!, maximum!, zero, 0.5)).toBeNull();
            }
        }
    });

    it('reviews the exact resolver identity, contextual branches and truthful infeasibility', () => {
        expect(hasStaticResolution(resolveWritingZero)).toBe(true);
        expect(hasStaticResolution(Object.assign((labels: string[]) => resolveWritingZero(labels), resolveWritingZero))).toBe(false);
        expect(findSchemaFallbackContractIssues(WritingGeneratorSchema)).toEqual([]);
        expect(resolveWritingZero([])).toBe(false);
        expect(resolveWritingZero([Scope.NumbersWithZero])).toBe(true);
        expect(resolveWritingZero([Scope.NumbersWithoutZero])).toBe(false);
        expect(resolveWritingZero([Scope.NumbersWithZero, Scope.NumbersWithoutZero])).toBeUndefined();
        expect(resolveWritingZero([Scope.NumbersWithoutZero, Scope.Numberline])).toBeUndefined();
        expect(resolveWritingZero([Scope.NumbersSmaller1000000])).toBeUndefined();
        expect(resolveWritingZero([Scope.NumbersLarger1000])).toBe(false);
        expect(resolveWritingZero([Scope.NumbersLarger1000, Scope.NumbersWithZero])).toBeUndefined();
        for (const [label, profile] of [[Scope.NumbersWithZero, 'coefficient-zero'],
            [Scope.NumbersWithoutZero, 'coefficient-nonzero']] as const) {
            const state = getRandomState();
            expect(resolveWritingZero([label, Scope.NumbersLarger1000, Scope.NumbersSmaller1000000])).toBe(profile);
            expect(getRandomState()).toBe(state);
        }
    });

    it('resolves before generation and emits only justified matching-capable claims', () => {
        const generator = new WritingGenerator();
        for (const notation of [Area.DigitNotation, Area.NumberNameNotation]) {
            for (const label of [Scope.NumbersWithZero, Scope.NumbersWithoutZero]) {
                for (let seed = 0; seed < 64; seed++) {
                    setSeed(seed);
                    const resolved = extractConfig(WritingGeneratorSchema, [notation, label,
                        Scope.NumbersLarger1000, Scope.NumbersSmaller1000000], {spec, owner: 'generator'});
                    expect(resolved.resolvedLabels).toContain(label);
                    const stub = generator.generate(resolved.config)!;
                    expect(hasWritingZero(stub.data.number)).toBe(label === Scope.NumbersWithZero);
                    if ('placeValues' in stub.data) {
                        expect(stub.data.placeValues.some(place => place.digit === 0)).toBe(label === Scope.NumbersWithZero);
                    }
                }
            }
        }
    });

    it('retains the old scalar branches and rejects invalid coefficient profiles', () => {
        const generator = new WritingGenerator();
        const config = {notationFamily: Area.DigitNotation, range: {min: 1111, max: 1111}};
        expect(generator.generate({...config, requireZero: 'coefficient-zero'})).toBeNull();
        expect(generator.generate({...config, requireZero: 'coefficient-nonzero'})!.data.number).toBe(1111);
        expect(generator.generate({...config, range: {min: 0, max: 0}, requireZero: 'coefficient-zero'})!.data.number).toBe(0);
        expect(() => generator.generate({...config, requireZero: 'other'} as any)).toThrow(/profile/);
        expect(() => generator.generate({...config, range: {min: 1, max: Infinity},
            requireZero: 'coefficient-zero'})).toThrow(/finite/);
        for (const requireZero of [false, true]) {
            const original = {notationFamily: Area.DigitNotation, range: {min: 0, max: 20}, requireZero};
            setSeed(7);
            const stub = generator.generate(original)!;
            expect(stub.data.number === 0).toBe(requireZero);
        }
    });
});
