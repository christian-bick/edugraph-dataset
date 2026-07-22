import {describe, expect, it} from 'vitest';
import {getTracePath} from './helpers.ts';

describe('shape-draw-shape helpers', () => {
    it('returns correct trace path for target shape', () => {
        expect(getTracePath('circle')).toBe('M 50 15 A 35 35 0 1 0 50 14.9 Z');
        expect(getTracePath('triangle')).toBe('M 50 10 L 90 90 L 10 90 Z');
        expect(getTracePath('square')).toBe('M 10 10 L 90 10 L 90 90 L 10 90 Z');
        expect(getTracePath('rectangle')).toBe('M 10 25 L 90 25 L 90 75 L 10 75 Z');
        expect(getTracePath('unknown')).toBe('');
    });
});
