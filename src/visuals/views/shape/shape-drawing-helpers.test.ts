import {describe, expect, it} from 'vitest';
import {
    getShapeDrawingFamily,
    getTracePath,
    rotationDrawingPresentation
} from './shape-drawing-helpers.ts';

describe('shape drawing helpers', () => {
    it('classifies every supported target into exactly one drawing family', () => {
        expect(getShapeDrawingFamily('circle')).toBe('circular');
        for (const target of ['triangle', 'square', 'rectangle', 'quadrilateral']) {
            expect(getShapeDrawingFamily(target)).toBe('linear');
        }
        expect(getShapeDrawingFamily('hexagon')).toBeUndefined();
        expect(getShapeDrawingFamily('pentagon')).toBeUndefined();
    });

    it('returns the trace path for each supported shape', () => {
        expect(getTracePath('circle')).toBe('M 50 18 A 32 32 0 1 0 50 17.9 Z');
        expect(getTracePath('triangle')).toBe('M 50 15 L 85 85 L 15 85 Z');
        expect(getTracePath('square')).toBe('M 15 15 L 85 15 L 85 85 L 15 85 Z');
        expect(getTracePath('rectangle')).toBe('M 15 25 L 85 25 L 85 75 L 15 75 Z');
        expect(getTracePath('quadrilateral')).toContain('L 88 12');
        expect(getTracePath('unknown')).toBe('');
    });

    it('keeps the response workspace blank until Solution Mode', () => {
        expect(rotationDrawingPresentation('triangle', false)).toEqual({
            referenceRotation: 180,
            showCompletedDrawing: false
        });
        expect(rotationDrawingPresentation('square', true)).toEqual({
            referenceRotation: 45,
            showCompletedDrawing: true
        });
    });
});
