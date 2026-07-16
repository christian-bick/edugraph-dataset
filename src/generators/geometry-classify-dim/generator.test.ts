import {beforeEach, describe, expect, it} from 'vitest';
import {GeometryClassifyDimGenerator} from './generator.ts';
import {setSeed} from '../../lib/random.ts';

describe('GeometryClassifyDimGenerator', () => {
    let generator: GeometryClassifyDimGenerator;

    beforeEach(() => {
        generator = new GeometryClassifyDimGenerator();
        setSeed(42);
    });

    it('should have the correct type', () => {
        expect(generator.type).toBe('geometry');
    });

    it('should validate classify-dim outputs', () => {
        const input = {
            labels: []
        };
        const stub = generator.generate(input);
        expect(stub).not.toBeNull();
        expect(['2d', '3d']).toContain(stub!.data.shapeType);
        expect(stub!.data.answer).toBe(stub!.data.shapeType);
    });
});
