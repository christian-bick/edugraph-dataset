import {beforeEach, describe, expect, it} from 'vitest';
import {GeometryBuildShapeGenerator} from './generator.ts';
import {setSeed} from '../../lib/random.ts';

describe('GeometryBuildShapeGenerator', () => {
    let generator: GeometryBuildShapeGenerator;

    beforeEach(() => {
        generator = new GeometryBuildShapeGenerator();
        setSeed(42);
    });

    it('should have the correct type', () => {
        expect(generator.type).toBe('geometry');
    });

    it('should validate build-shape sticks and corners counts', () => {
        const input = {
            labels: []
        };
        const stub = generator.generate(input);
        expect(stub).not.toBeNull();
        
        const target = stub!.data.target;
        if (target === 'triangle') {
            expect(stub!.data.sides).toBe(3);
            expect(stub!.data.corners).toBe(3);
        } else if (target === 'square' || target === 'rectangle') {
            expect(stub!.data.sides).toBe(4);
            expect(stub!.data.corners).toBe(4);
        }
    });
});
