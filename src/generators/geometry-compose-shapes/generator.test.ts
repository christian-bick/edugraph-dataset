import { describe, it, expect, beforeEach } from 'vitest';
import { GeometryComposeShapesGenerator } from './generator.ts';
import { setSeed } from '../../lib/random.ts';

describe('GeometryComposeShapesGenerator', () => {
    let generator: GeometryComposeShapesGenerator;

    beforeEach(() => {
        generator = new GeometryComposeShapesGenerator();
        setSeed(42);
    });

    it('should have the correct type', () => {
        expect(generator.type).toBe('geometry');
    });

    it('should validate compose-shapes outputs', () => {
        const input = {
            labels: [],
            constraints: { target: 'rectangle', components: ['triangles'] }
        };
        const stub = generator.generate(input);
        expect(stub).not.toBeNull();
        expect(stub!.data.target).toBe('rectangle');
        expect(stub!.data.components).toEqual(['triangles']);
        expect(stub!.data.answer).toBe('triangle');
    });
});
