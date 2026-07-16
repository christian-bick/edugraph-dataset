import {beforeEach, describe, expect, it} from 'vitest';
import {GeometryDrawShapeGenerator} from './generator.ts';
import {setSeed} from '../../lib/random.ts';

describe('GeometryDrawShapeGenerator', () => {
    let generator: GeometryDrawShapeGenerator;

    beforeEach(() => {
        generator = new GeometryDrawShapeGenerator();
        setSeed(42);
    });

    it('should have the correct type', () => {
        expect(generator.type).toBe('geometry');
    });

    it('should validate draw-shape outputs', () => {
        const input = {
            labels: [],
            constraints: {}
        };
        const stub = generator.generate(input);
        expect(stub).not.toBeNull();
        expect(stub!.data.target).toBeDefined();
        expect(stub!.data.answer).toBe(stub!.data.target);
    });
});
