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
        expect(getTracePath('triangle')).toBe('M 50 15 L 85 85 L 15 85 Z');
        expect(getTracePath('square')).toBe('M 15 15 L 85 15 L 85 85 L 15 85 Z');
        expect(getTracePath('rectangle')).toBe('M 15 25 L 85 25 L 85 75 L 15 75 Z');
        expect(getTracePath('quadrilateral')).toContain('L 88 12');
        expect(getTracePath('unknown')).toBe('');
    });

    it('draws a closed circle from two diametric arcs with safe bounds', () => {
        const path = getTracePath('circle');
        expect(path.match(/[A-Za-z]/g)).toEqual(['M', 'A', 'A', 'Z']);
        const coordinates = path.match(/-?\d+(?:\.\d+)?/g)!.map(Number);
        expect(coordinates).toHaveLength(16);
        const start = coordinates.slice(0, 2);
        let previous = start;

        for (const arc of [coordinates.slice(2, 9), coordinates.slice(9, 16)]) {
            const [rx, ry, axisRotation, largeArc, sweep, x, y] = arc;
            expect(rx).toBe(32);
            expect(ry).toBe(rx);
            expect(axisRotation).toBe(0);
            expect([largeArc, sweep]).toEqual([1, 1]);
            // Opposite endpoints force a semicircle centered at their midpoint.
            expect(Math.hypot(x - previous[0], y - previous[1])).toBe(2 * rx);
            const center = [(x + previous[0]) / 2, (y + previous[1]) / 2];
            expect(center).toEqual([50, 50]);
            for (const value of center) {
                expect(value - rx).toBe(18);
                expect(value + rx).toBe(82);
                expect(value - rx - 2).toBeGreaterThan(0);
                expect(value + rx + 2).toBeLessThan(100);
            }
            previous = [x, y];
        }

        expect(previous).toEqual(start);
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
        expect(rotationDrawingPresentation('circle', false)).toEqual({
            referenceRotation: 90,
            showCompletedDrawing: false
        });
    });
});
