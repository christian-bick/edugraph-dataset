import { describe, it, expect } from 'vitest';
import { getBallPosition } from './helpers.ts';

describe('geometry-position helpers', () => {
    it('returns correct ball position for relation', () => {
        expect(getBallPosition('above')).toEqual({ x: 130, y: 25 });
        expect(getBallPosition('below')).toEqual({ x: 130, y: 150 });
        expect(getBallPosition('nextTo')).toEqual({ x: 200, y: 90 });
    });
});
