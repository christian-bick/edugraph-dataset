import { describe, it, expect } from 'vitest';
import { generatePositions } from './helpers.ts';

describe('counting-objects helpers', () => {
    it('generates line positions correctly', () => {
        const pos = generatePositions(3, 'line', 'test-id-1');
        expect(pos.length).toBe(3);
        // All positions should have the same y-coordinate
        expect(pos[0].y).toBe(pos[1].y);
        expect(pos[1].y).toBe(pos[2].y);
        // x-coordinates should be ascending
        expect(pos[0].x).toBeLessThan(pos[1].x);
        expect(pos[1].x).toBeLessThan(pos[2].x);
    });

    it('generates circle positions correctly', () => {
        const pos = generatePositions(4, 'circle', 'test-id-2');
        expect(pos.length).toBe(4);
        // Check symmetry around center (225, 150) - size is adjusted by -20
        // Center of objects is (x+20, y+20). For circle arrangement, they should lie on a circle.
        const center = { x: 225, y: 150 };
        const radius = Math.min(450, 300) / 2 - 40; // 110
        pos.forEach(p => {
            const dx = (p.x + 20) - center.x;
            const dy = (p.y + 20) - center.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            expect(Math.abs(dist - radius)).toBeLessThan(1e-3);
        });
    });

    it('generates array positions correctly', () => {
        const pos = generatePositions(6, 'array', 'test-id-3');
        expect(pos.length).toBe(6);
    });

    it('generates scattered positions deterministically', () => {
        const pos1 = generatePositions(5, 'scattered', 'deterministic-seed');
        const pos2 = generatePositions(5, 'scattered', 'deterministic-seed');
        expect(pos1).toEqual(pos2);
    });
});
