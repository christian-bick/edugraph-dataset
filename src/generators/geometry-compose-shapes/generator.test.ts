import {beforeEach, describe, expect, it} from 'vitest';
import {GeometryComposeShapesGenerator} from './generator.ts';
import {setSeed} from '../../lib/random.ts';

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
            labels: []
        };
        const stub = generator.generate(input);
        expect(stub).not.toBeNull();
        expect(['rectangle', 'square']).toContain(stub!.data.target);
        expect(stub!.data.components.length).toBeGreaterThan(0);
        expect(stub!.data.answer).toBe('triangle');
    });
});
