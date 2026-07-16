import { describe, it, expect, beforeEach } from 'vitest';
import { GeometryPositionGenerator } from './generator.ts';
import { setSeed } from '../../lib/random.ts';

describe('GeometryPositionGenerator', () => {
    let generator: GeometryPositionGenerator;

    beforeEach(() => {
        generator = new GeometryPositionGenerator();
        setSeed(42);
    });

    it('should have the correct type', () => {
        expect(generator.type).toBe('geometry');
    });

    it('should validate position mode mappings', () => {
        const input = {
            labels: [],
            constraints: { mode: 'position', relation: 'below' }
        };
        const stub = generator.generate(input);
        expect(stub).not.toBeNull();
        expect(stub!.data.relation).toBe('below');
        expect(stub!.data.answer).toBe('below');
    });

    it('should return null for non-position modes', () => {
        const stub = generator.generate({
            labels: [],
            constraints: { mode: 'name-2d' }
        });
        expect(stub).toBeNull();
    });
});
