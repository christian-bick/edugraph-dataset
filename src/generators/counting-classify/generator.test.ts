import { describe, it, expect, beforeEach } from 'vitest';
import { CountingClassifyGenerator } from './generator.ts';
import { setSeed } from '../../lib/random.ts';

describe('CountingClassifyGenerator', () => {
    let generator: CountingClassifyGenerator;

    beforeEach(() => {
        generator = new CountingClassifyGenerator();
        setSeed(42);
    });

    it('should have the correct type', () => {
         expect(generator.type).toBe('counting');
    });

    it('should validate classify-count items and categories logic', () => {
        const input = {
            labels: [],
            constraints: { mode: 'classify-count', minTotal: 6, maxTotal: 10, classifyType: 'shape' }
        };
        for (let i = 0; i < 20; i++) {
            const stub = generator.generate(input);
            expect(stub).not.toBeNull();
            expect(stub!.data.mode).toBe('classify-count');
            expect(stub!.data.classifyType).toBe('shape');
            expect(stub!.data.items.length).toBeGreaterThanOrEqual(6);
            expect(stub!.data.items.length).toBeLessThanOrEqual(10);
            
            const cats = stub!.data.categories;
            const total = (cats.circle || 0) + (cats.square || 0) + (cats.triangle || 0);
            expect(total).toBe(stub!.data.items.length);
        }
    });

    it('should validate classify-sort least/most logic and tie filtering', () => {
        const input = {
            labels: [],
            constraints: { mode: 'classify-sort', minTotal: 6, maxTotal: 10, relation: 'most', classifyType: 'color' }
        };
        for (let i = 0; i < 50; i++) {
            const stub = generator.generate(input);
            if (stub) {
                expect(stub.data.mode).toBe('classify-sort');
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

    it('should return null for non-classify modes', () => {
        const stub = generator.generate({
            labels: [],
            constraints: { mode: 'simple' }
        });
        expect(stub).toBeNull();
    });
});
