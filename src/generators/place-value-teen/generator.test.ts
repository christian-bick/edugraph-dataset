import { describe, it, expect, beforeEach } from 'vitest';
import { PlaceValueTeenGenerator } from './generator.ts';
import { setSeed } from '../../lib/random.ts';

describe('PlaceValueTeenGenerator', () => {
    let generator: PlaceValueTeenGenerator;

    beforeEach(() => {
        generator = new PlaceValueTeenGenerator();
        setSeed(42);
    });

    it('should have the correct type', () => {
        expect(generator.type).toBe('arithmetic');
    });

    it('should generate valid compose-teen stubs', () => {
        const input = {
            labels: [],
            constraints: { mode: 'compose-teen', target: 15 }
        };
        const stub = generator.generate(input);
        expect(stub).not.toBeNull();
        expect(stub!.data.ones).toBe(5);
        expect(stub!.data.target).toBe(15);
        expect(stub!.id).toBe('compose-teen-15');
    });

    it('should generate valid decompose-teen stubs', () => {
        const input = {
            labels: [],
            constraints: { mode: 'decompose-teen', target: 18 }
        };
        const stub = generator.generate(input);
        expect(stub).not.toBeNull();
        expect(stub!.data.ones).toBe(8);
        expect(stub!.data.target).toBe(18);
        expect(stub!.id).toBe('decompose-teen-18');
    });

    it('should return null for unsupported modes', () => {
        const stub = generator.generate({
            labels: [],
            constraints: { mode: 'unsupported' }
        });
        expect(stub).toBeNull();
    });
});
