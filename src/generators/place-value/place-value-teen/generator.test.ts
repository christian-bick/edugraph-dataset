import {beforeEach, describe, expect, it} from 'vitest';
import {PlaceValueTeenGenerator} from './generator.ts';
import {setSeed} from '../../../lib/random.ts';
import {createCanonicalNumericRange} from '../../../lib/canonical-numeric-range.ts';

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
            range: createCanonicalNumericRange(20)
        });
        expect(stub).not.toBeNull();
        expect(stub!.data.ones).toBeGreaterThanOrEqual(1);
        expect(stub!.data.ones).toBeLessThanOrEqual(4);
        expect(stub!.data.target).toBe(10 + stub!.data.ones);
    });

    it('honors a strongest lower bound on the extra ones', () => {
        const stub = generator.generate({
            range: createCanonicalNumericRange(20, 5)
        });
        expect(stub).not.toBeNull();
        expect(stub!.data.ones).toBeGreaterThanOrEqual(5);
        expect(stub!.data.ones).toBeLessThanOrEqual(9);
        expect(stub!.data.target).toBe(10 + stub!.data.ones);
    });

    it('never emits values outside 11-19 for the NumbersSmaller20 range', () => {
        // NumbersSmaller20 resolves to min=0, max=20; the generator's dedicated
        // teen invariant must still stay strictly within 11-19 for every seed.
        for (let s = 0; s < 50; s++) {
            setSeed(s);
            const stub = generator.generate({ range: createCanonicalNumericRange(20, s % 2 === 0 ? 0 : 5) });
            expect(stub).not.toBeNull();
            expect(stub!.data.ones).toBeGreaterThanOrEqual(1);
            expect(stub!.data.ones).toBeLessThanOrEqual(9);
            expect(stub!.data.target).toBeGreaterThanOrEqual(11);
            expect(stub!.data.target).toBeLessThanOrEqual(19);
        }
    });

    it('should throw validation error if range configuration is missing', () => {
        expect(() => generator.generate({} as any)).toThrow();
    });

    it('should throw validation error if range bounds are invalid', () => {
        expect(() => generator.generate({ range: createCanonicalNumericRange(10) })).toThrow();
        expect(() => generator.generate({ range: createCanonicalNumericRange(20, 10) })).toThrow();
    });
});
