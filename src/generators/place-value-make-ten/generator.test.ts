import { describe, it, expect, beforeEach } from 'vitest';
import { PlaceValueMakeTenGenerator } from './generator.ts';
import { setSeed } from '../../lib/random.ts';

describe('PlaceValueMakeTenGenerator', () => {
    let generator: PlaceValueMakeTenGenerator;

    beforeEach(() => {
        generator = new PlaceValueMakeTenGenerator();
        setSeed(42);
    });

    it('should have the correct type', () => {
        expect(generator.type).toBe('arithmetic');
    });

    it('should generate correct make-ten missing addends', () => {
        const input = {
            labels: [],
            constraints: { mode: 'make-ten', givenNumber: 7 }
        };
        const stub = generator.generate(input);
        expect(stub).not.toBeNull();
        expect(stub!.data.givenNumber).toBe(7);
        expect(stub!.data.missingNumber).toBe(3);
        expect(stub!.data.target).toBe(10);
    });

    it('should return null for non-make-ten modes', () => {
        const stub = generator.generate({
            labels: [],
            constraints: { mode: 'standard' }
        });
        expect(stub).toBeNull();
    });
});
