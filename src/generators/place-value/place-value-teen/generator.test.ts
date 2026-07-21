import {beforeEach, describe, expect, it} from 'vitest';
import {PlaceValueTeenGenerator} from './generator.ts';
import {setSeed} from '../../../lib/random.ts';

describe('PlaceValueTeenGenerator', () => {
    let generator: PlaceValueTeenGenerator;

    beforeEach(() => {
        generator = new PlaceValueTeenGenerator();
        setSeed(42);
    });

    it('should have the correct type', () => {
        expect(generator.type).toBe('arithmetic');
    });

    it('should generate valid place value teen stubs with range within teen boundaries', () => {
        const stub = generator.generate({
            range: { min: 12, max: 18 }
        });
        expect(stub).not.toBeNull();
        expect(stub!.data.ones).toBeGreaterThanOrEqual(2);
        expect(stub!.data.ones).toBeLessThanOrEqual(8);
        expect(stub!.data.target).toBe(10 + stub!.data.ones);
    });

    it('should clamp bounds if range exceeds teen boundaries', () => {
        const stub = generator.generate({
            range: { min: 5, max: 25 }
        });
        expect(stub).not.toBeNull();
        expect(stub!.data.ones).toBeGreaterThanOrEqual(1);
        expect(stub!.data.ones).toBeLessThanOrEqual(9);
        expect(stub!.data.target).toBe(10 + stub!.data.ones);
    });

    it('should throw validation error if range configuration is missing', () => {
        expect(() => generator.generate({} as any)).toThrow();
    });
});
