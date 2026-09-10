import {describe, expect, it} from 'vitest';
import {GeneratorValidationError} from '../../../lib/errors.ts';
import {PartitionPoint} from '../../../types/problems.ts';
import {ShapePartitionEquivalenceGenerator} from './generator.ts';

const generator = new ShapePartitionEquivalenceGenerator();
const opposite = ({x, y}: PartitionPoint) => ({x: x === 0 ? 0 : -x, y: y === 0 ? 0 : -y});

describe('ShapePartitionEquivalenceGenerator', () => {
    it('strictly requires the shape', () => {
        expect(() => generator.generate({})).toThrow(GeneratorValidationError);
    });

    it('bisects one rectangle into rectangles and into triangles', () => {
        const {whole, boundaries} = generator.generate({shape: 'rectangle'})!.data;
        expect(whole.shape).toBe('rectangle');
        if (whole.shape !== 'rectangle') throw new Error('Expected rectangle');
        const [median, diagonal] = boundaries;
        if (median.kind !== 'segment' || diagonal.kind !== 'segment') throw new Error('Expected segments');
        expect(median.start).toEqual({x: 0, y: -whole.height / 2});
        expect(median.end).toEqual(opposite(median.start));
        expect(diagonal.start).toEqual({x: -whole.width / 2, y: -whole.height / 2});
        expect(diagonal.end).toEqual(opposite(diagonal.start));
        const rectangularShareArea = whole.width / 2 * whole.height;
        const triangularShareArea = whole.width * whole.height / 2;
        expect(rectangularShareArea).toBe(triangularShareArea);
        expect(rectangularShareArea).toBeGreaterThan(0);
    });

    it('bisects a disk with a diameter and an interior half-turn-symmetric curve', () => {
        const {whole, boundaries} = generator.generate({shape: 'circle'})!.data;
        expect(whole.shape).toBe('circle');
        if (whole.shape !== 'circle') throw new Error('Expected circle');
        const [diameter, curve] = boundaries;
        if (diameter.kind !== 'segment' || curve.kind !== 'cubic') throw new Error('Expected diameter and curve');
        expect(diameter.start).toEqual({x: 0, y: -whole.radius});
        expect(diameter.end).toEqual(opposite(diameter.start));
        expect(curve.start).toEqual(diameter.start);
        expect(curve.segments).toHaveLength(2);
        const [upper, lower] = curve.segments;
        expect(upper.end).toEqual({x: 0, y: 0});
        expect(lower.control1).toEqual(opposite(upper.control2));
        expect(lower.control2).toEqual(opposite(upper.control1));
        expect(lower.end).toEqual(opposite(curve.start));
        expect(upper.control1.x).not.toBe(0); // Not merely another semicircle.

        // All control points lie in the convex disk and their y coordinates increase.
        // The two Bezier segments therefore stay inside it without self-intersections.
        let previousY = -Infinity;
        for (const p of [curve.start, ...curve.segments.flatMap(s => [s.control1, s.control2, s.end])]) {
            expect(p.x ** 2 + p.y ** 2).toBeLessThanOrEqual(whole.radius ** 2);
            expect(p.y).toBeGreaterThanOrEqual(previousY);
            previousY = p.y;
        }
    });

    it('rejects unsupported shapes', () => {
        expect(generator.generate({shape: 'unsupported' as 'circle'})).toBeNull();
    });
});
