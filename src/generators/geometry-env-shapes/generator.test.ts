import { beforeEach, describe, expect, it } from 'vitest';
import { GeometryEnvShapesGenerator } from './generator.ts';
import { setSeed } from '../../lib/random.ts';
import { Area } from 'edugraph-ts';

describe('GeometryEnvShapesGenerator', () => {
    let generator: GeometryEnvShapesGenerator;

    beforeEach(() => {
        generator = new GeometryEnvShapesGenerator();
        setSeed(42);
    });

    it('should have the correct type', () => {
        expect(generator.type).toBe('geometry');
    });

    it('should validate env-shapes outputs when no config is provided', () => {
        const stub = generator.generate({});
        expect(stub).not.toBeNull();
        expect(['circle', 'square', 'rectangle']).toContain(stub!.data.answer);
        expect(['clock', 'window', 'table']).toContain(stub!.data.target);
    });

    it('should generate clock when Circle is requested', () => {
        const stub = generator.generate({ classify: Area.Circle });
        expect(stub).not.toBeNull();
        expect(stub!.data.answer).toBe('circle');
        expect(stub!.data.target).toBe('clock');
    });

    it('should generate window when Square is requested', () => {
        const stub = generator.generate({ classify: Area.Square });
        expect(stub).not.toBeNull();
        expect(stub!.data.answer).toBe('square');
        expect(stub!.data.target).toBe('window');
    });

    it('should generate table when Rectangle is requested', () => {
        const stub = generator.generate({ classify: Area.Rectangle });
        expect(stub).not.toBeNull();
        expect(stub!.data.answer).toBe('rectangle');
        expect(stub!.data.target).toBe('table');
    });
});
