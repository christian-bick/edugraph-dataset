import {describe, expect, it} from 'vitest';
import {getTracingPaths} from './helpers.ts';

describe('numbers-write-stroke helpers', () => {
    it('returns path string for 1', () => {
        const paths = getTracingPaths('1', 30, 48);
        expect(paths.length).toBe(1);
        expect(paths[0]).toContain('M 30 23 L 30 43');
    });

    it('returns paths array for 0', () => {
        const paths = getTracingPaths('0', 30, 48);
        expect(paths.length).toBe(2);
        expect(paths[0]).toContain('M 38 33 A 8 10');
    });

    it('returns empty array for invalid digit', () => {
        const paths = getTracingPaths('a', 30, 48);
        expect(paths.length).toBe(0);
    });
});
