import {describe, expect, it} from 'vitest';
import {getRandomState, random, setRandomState, setSeed, withoutRandomness} from './random.ts';

describe('randomness isolation', () => {
    it('preserves the existing seeded continuation across pure and nested operations', () => {
        setSeed('same'); const expected = [random(), random()];
        setSeed('same'); const first = random(); const state = getRandomState();
        const native = Math.random;
        expect(withoutRandomness(() => withoutRandomness(() => 42))).toBe(42);
        expect(getRandomState()).toBe(state);
        expect([first, random()]).toEqual(expected);
        expect(Math.random).toBe(native);
    });
    it.each([() => random(), () => Math.random(), () => setSeed(0), () => setRandomState(0), () => getRandomState()])(
        'rejects consumption or state replacement even when the callback catches it', attempt => {
            setSeed(44); const native = Math.random;
            expect(() => withoutRandomness(() => {try {attempt();} catch { /* Cannot swallow the contract. */ }})).toThrow();
            expect(getRandomState()).toBe(44); expect(Math.random).toBe(native);
        });
    it('restores the guard on errors and validates normal state restoration', () => {
        expect(() => withoutRandomness(() => {throw new Error('failure');})).toThrow('failure');
        setSeed(12); const value = random(); setRandomState(12); expect(random()).toBe(value);
        expect(() => setRandomState(-1)).toThrow();
    });
});
