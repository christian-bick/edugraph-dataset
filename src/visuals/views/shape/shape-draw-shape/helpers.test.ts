import {describe, expect, it} from 'vitest';
import {getTracePath} from './helpers.ts';

describe('shape-draw-shape helpers', () => {
    it('returns correct trace path for target shape', () => {
        expect(getTracePath('circle')).toBe('M 50 18 A 32 32 0 1 0 50 17.9 Z');
        expect(getTracePath('triangle')).toBe('M 50 15 L 85 85 L 15 85 Z');
        expect(getTracePath('square')).toBe('M 15 15 L 85 15 L 85 85 L 15 85 Z');
        expect(getTracePath('rectangle')).toBe('M 15 25 L 85 25 L 85 75 L 15 75 Z');
        expect(getTracePath('unknown')).toBe('');
    });
});
