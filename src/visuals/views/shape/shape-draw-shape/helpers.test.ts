import {describe, expect, it} from 'vitest';
import {getTracePath} from './helpers.ts';

describe('geometry-draw-shape helpers', () => {
    it('returns correct trace path for target shape', () => {
        expect(getTracePath('circle')).toBe('M 75 75 A 40 40 0 1 0 75 74.9');
        expect(getTracePath('triangle')).toBe('M 50 10 L 90 90 L 10 90 Z');
        expect(getTracePath('square')).toBe('M 10 10 L 90 10 L 90 90 L 10 90 Z');
        expect(getTracePath('unknown')).toBe('');
    });
});
