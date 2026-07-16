import { describe, it, expect, beforeEach } from 'vitest';
import { GeometryClassifyDimGenerator } from './generator.ts';
import { setSeed } from '../../lib/random.ts';

describe('GeometryClassifyDimGenerator', () => {
    let generator: GeometryClassifyDimGenerator;

    beforeEach(() => {
        generator = new GeometryClassifyDimGenerator();
        setSeed(42);
    });

    it('should have the correct type', () => {
        expect(generator.type).toBe('geometry');
    });

    it('should validate classify-dim 2D and 3D outputs', () => {
        const input2D = {
            labels: [],
            constraints: { mode: 'classify-dim', shapeType: '2d' }
        };
        const stub2D = generator.generate(input2D);
        expect(stub2D).not.toBeNull();
        expect(stub2D!.data.shapeType).toBe('2d');
        expect(stub2D!.data.answer).toBe('2d');

        const input3D = {
            labels: [],
            constraints: { mode: 'classify-dim', shapeType: '3d' }
        };
        const stub3D = generator.generate(input3D);
        expect(stub3D).not.toBeNull();
        expect(stub3D!.data.shapeType).toBe('3d');
        expect(stub3D!.data.answer).toBe('3d');
    });

    it('should return null for non-classify-dim modes', () => {
        const stub = generator.generate({
            labels: [],
            constraints: { mode: 'name-2d' }
        });
        expect(stub).toBeNull();
    });
});
