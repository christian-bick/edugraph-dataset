import { describe, it, expect, beforeEach } from 'vitest';
import { CountingClassifySortGenerator } from './generator.ts';
import { setSeed } from '../../lib/random.ts';

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
        const input = {
            labels: [],
            constraints: { minTotal: 6, maxTotal: 10, relation: 'most', classifyType: 'color' }
        };
        for (let i = 0; i < 50; i++) {
            const stub = generator.generate(input);
            if (stub) {
                expect(stub.data.classifyType).toBe('color');
                expect(stub.data.relation).toBe('most');
                
                const answer = stub.data.answer;
                const cats = stub.data.categories;
                
                const maxVal = cats[answer];
                const possibleColors = ['red', 'blue', 'green'];
                possibleColors.forEach(color => {
                    if (color !== answer) {
                        expect(cats[color]).toBeLessThan(maxVal);
                    }
                });
            }
        }
    });
});
