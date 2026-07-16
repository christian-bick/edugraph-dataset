import { describe, it, expect, beforeEach } from 'vitest';
import { PlaceValueDecomposeTeenGenerator } from './generator.ts';
import { setSeed } from '../../lib/random.ts';

describe('PlaceValueDecomposeTeenGenerator', () => {
    let generator: PlaceValueDecomposeTeenGenerator;

    beforeEach(() => {
        generator = new PlaceValueDecomposeTeenGenerator();
        setSeed(42);
    });

    it('should have the correct type', () => {
        expect(generator.type).toBe('arithmetic');
    });

    it('should generate correct teen decompose structures', () => {
        const input = {
            labels: [],
            constraints: { mode: 'decompose-teen', ones: 7 }
        };
        const stub = generator.generate(input);
        expect(stub).not.toBeNull();
        expect(stub!.data.mode).toBe('decompose-teen');
        expect(stub!.data.ones).toBe(7);
        expect(stub!.data.target).toBe(17);
    });

    it('should return null for non-decompose-teen modes', () => {
        const stub = generator.generate({
            labels: [],
            constraints: { mode: 'standard' }
        });
        expect(stub).toBeNull();
    });
});
