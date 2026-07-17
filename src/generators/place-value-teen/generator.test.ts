import {beforeEach, describe, expect, it} from 'vitest';
import {PlaceValueTeenGenerator} from './generator.ts';
import {setSeed} from '../../lib/random.ts';

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
        const stub = generator.generate({
            range: { min: 11, max: 19 }
        });
        expect(stub).not.toBeNull();
        expect(stub!.data.ones).toBeGreaterThanOrEqual(1);
        expect(stub!.data.ones).toBeLessThanOrEqual(9);
        expect(stub!.data.target).toBe(10 + stub!.data.ones);
    });
});
