import { describe, it, expect, beforeEach } from 'vitest';
import { PlaceValueComposeTeenGenerator } from './generator.ts';
import { setSeed } from '../../lib/random.ts';

describe('PlaceValueComposeTeenGenerator', () => {
    let generator: PlaceValueComposeTeenGenerator;

    beforeEach(() => {
        generator = new PlaceValueComposeTeenGenerator();
        setSeed(42);
    });

    it('should have the correct type', () => {
        expect(generator.type).toBe('arithmetic');
    });

    it('should generate correct teen compose structures', () => {
        const input = {
            labels: [],
            constraints: { mode: 'compose-teen', ones: 5 }
        };
        const stub = generator.generate(input);
        expect(stub).not.toBeNull();
        expect(stub!.data.ones).toBe(5);
        expect(stub!.data.target).toBe(15);
    });

    it('should return null for non-compose-teen modes', () => {
        const stub = generator.generate({
            labels: [],
            constraints: { mode: 'standard' }
        });
        expect(stub).toBeNull();
    });
});
