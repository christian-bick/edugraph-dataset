import {describe, expect, it, vi} from 'vitest';
import * as rng from '../../../lib/random.ts';
import {hasCanonicalRangeWitness} from '../../../lib/canonical-numeric-range.ts';
import {NumberArrayGenerator} from './generator.ts';
import {arrayCandidates, arrayOperations, arrayProfiles, arrayQuantities} from './profiles.ts';

describe('NumberArrayGenerator canonical profiles', () => {
    const generator = new NumberArrayGenerator();
    it('strictly validates the resolved profile', () => {
        expect(() => generator.generate({})).toThrow();
        expect(() => generator.generate({operation: 'addition', requireTwoOperands: false, profile: {} as never})).toThrow();
    });
    it('exhaustively preserves every original array and every approved binary column count', () => {
        for (const [, operation] of arrayOperations) {
            for (const twoOperands of [false, true]) {
                const seen = new Set<string>();
                for (const {profile} of arrayProfiles) {
                    if (profile.iterated) continue;
                    for (const data of arrayCandidates(operation, twoOperands, profile)) {
                        expect(hasCanonicalRangeWitness(arrayQuantities(data), profile.range)).toBe(true);
                        expect(data.total).toBe(data.rows * data.columns);
                        expect(data.answer).toBe(operation === 'partitive-division' ? data.columns
                            : operation === 'quotative-division' ? data.rows : data.total);
                        seen.add(`${data.rows}x${data.columns}`);
                    }
                }
                const expected = new Set<string>();
                for (let rows = 2; rows <= (operation === 'addition' && twoOperands ? 2 : 5); rows++) {
                    for (let columns = 2; columns <= (operation === 'addition' && twoOperands ? 20 : 5); columns++) {
                        expected.add(`${rows}x${columns}`);
                    }
                }
                expect(seen).toEqual(expected);
            }
        }
    });
    it('samples only feasible profiles and preserves every candidate deterministically', () => {
        for (const [, operation] of arrayOperations) {
            for (const requireTwoOperands of [false, true]) {
                for (const {profile} of arrayProfiles) {
                    const candidates = arrayCandidates(operation, requireTwoOperands, profile);
                    const config = {operation, requireTwoOperands, profile};
                    if (!candidates.length) { expect(generator.generate(config)).toBeNull(); continue; }
                    for (let index = 0; index < candidates.length; index++) {
                        const spy = vi.spyOn(rng, 'random').mockReturnValue((index + 0.5) / candidates.length);
                        try { expect(generator.generate(config)!.data).toEqual(candidates[index]); }
                        finally { spy.mockRestore(); }
                    }
                    rng.setSeed(17); const first = generator.generate(config);
                    rng.setSeed(17); expect(generator.generate(config)).toEqual(first);
                }
            }
        }
    });
    it('retains all twelve iterated-addition arrays and excludes binary iterated claims', () => {
        const seen = new Set<string>();
        for (const {profile} of arrayProfiles.filter(({profile}) => profile.iterated)) {
            expect(arrayCandidates('addition', true, profile)).toEqual([]);
            expect(arrayCandidates('multiplication', false, profile)).toEqual([]);
            for (const data of arrayCandidates('addition', false, profile)) {
                expect(data.rows).toBeGreaterThanOrEqual(3);
                expect(data.columns).toBeLessThanOrEqual(5);
                expect(data.addends).toEqual(Array.from({length: data.rows}, () => data.columns));
                seen.add(`${data.rows}x${data.columns}`);
            }
        }
        expect(seen.size).toBe(12);
        expect(arrayCandidates('unsupported' as never, false, arrayProfiles[0].profile)).toEqual([]);
    });
});
