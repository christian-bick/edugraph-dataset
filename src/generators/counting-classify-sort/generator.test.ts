import {beforeEach, describe, expect, it} from 'vitest';
import {CountingClassifySortGenerator} from './generator.ts';
import {setSeed} from '../../lib/random.ts';
import {Scope} from 'edugraph-ts';

describe('CountingClassifySortGenerator', () => {
    let generator: CountingClassifySortGenerator;

    beforeEach(() => {
        generator = new CountingClassifySortGenerator();
        setSeed(42);
    });

    it('should have the correct type', () => {
         expect(generator.type).toBe('counting');
    });

    it('should validate classify-sort least/most logic and tie filtering', () => {
        const config = {
            range: { min: 1, max: 10 },
            wantsMost: true,
            wantsLeast: false
        };
        for (let i = 0; i < 50; i++) {
            const stub = generator.generate(config);
            if (stub) {
                expect(stub.data.relation).toBe('most');
                
                const answer = stub.data.answer;
                const cats = stub.data.categories;
                
                const maxVal = cats[answer];
                const possibleCats = ['A', 'B', 'C'];
                possibleCats.forEach(cat => {
                    if (cat !== answer) {
                        expect(cats[cat]).toBeLessThan(maxVal);
                    }
                });
            }
        }
    });
});
