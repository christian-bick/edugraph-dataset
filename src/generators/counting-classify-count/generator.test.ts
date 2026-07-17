import {beforeEach, describe, expect, it} from 'vitest';
import {CountingClassifyCountGenerator} from './generator.ts';
import {setSeed} from '../../lib/random.ts';

describe('CountingClassifyCountGenerator', () => {
    let generator: CountingClassifyCountGenerator;

    beforeEach(() => {
        generator = new CountingClassifyCountGenerator();
        setSeed(42);
    });

    it('should have the correct type', () => {
         expect(generator.type).toBe('counting');
    });

    it('should validate classify-count items and categories logic', () => {
        const config = {
            range: { min: 1, max: 10 }
        };
        for (let i = 0; i < 20; i++) {
            const stub = generator.generate(config);
            expect(stub).not.toBeNull();
            expect(stub!.data.items.length).toBeGreaterThanOrEqual(1);
            expect(stub!.data.items.length).toBeLessThanOrEqual(10);
            
            const cats = stub!.data.categories;
            const total = (cats['A'] || 0) + (cats['B'] || 0) + (cats['C'] || 0);
            expect(total).toBe(stub!.data.items.length);
        }
    });
});
