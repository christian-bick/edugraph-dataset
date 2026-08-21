import {describe, expect, it} from 'vitest';
import {createWorkCounters} from './work-counters.ts';

describe('createWorkCounters', () => {
    it('accumulates named work and treats absent counters as zero', () => {
        const counters = createWorkCounters({files: 2});

        counters.add('files');
        counters.add('bytes', 12);

        expect(counters.get('files')).toBe(3);
        expect(counters.get('bytes')).toBe(12);
        expect(counters.get('missing')).toBe(0);
    });

    it('returns a stable, immutable snapshot', () => {
        const counters = createWorkCounters();
        counters.add('zeta');
        counters.add('alpha', 2);

        const snapshot = counters.snapshot();
        expect(Object.keys(snapshot)).toEqual(['alpha', 'zeta']);
        expect(snapshot).toEqual({alpha: 2, zeta: 1});
        expect(Object.isFrozen(snapshot)).toBe(true);
    });

    it('rejects non-finite work amounts', () => {
        const counters = createWorkCounters();
        expect(() => counters.add('bad', Number.NaN)).toThrow(/Invalid work-counter amount/);
    });
});
