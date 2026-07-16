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

    it('should generate valid place value teen stubs', () => {
        const input = {
            labels: [],
            constraints: { target: 15 }
        };
        const stub = generator.generate(input);
        expect(stub).not.toBeNull();
        expect(stub!.data.ones).toBe(5);
        expect(stub!.data.target).toBe(15);
        expect(stub!.id).toBe('place-value-teen-15');
    });
});
