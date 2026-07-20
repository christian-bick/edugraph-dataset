import { beforeEach, describe, expect, it } from 'vitest';
import { CountingClassifySortGenerator } from './generator.ts';
import { setSeed } from '../../lib/random.ts';
import { Scope } from 'edugraph-ts';
import { generateWithLabels } from '../../lib/utils.ts';

describe('CountingClassifySortGenerator Spec Integration', () => {
    let generator: CountingClassifySortGenerator;

    beforeEach(() => {
        generator = new CountingClassifySortGenerator();
    });

    it('should generate classify-sort problems using labels', () => {
        let stub = null;
        for (let seed = 42; seed < 100; seed++) {
            setSeed(seed);
            stub = generateWithLabels(generator, [
                Scope.NumbersSmaller10,
                Scope.Most
            ]);
            if (stub !== null) break;
        }
        
        expect(stub).not.toBeNull();
        expect(stub!.data.numObjects).toBeGreaterThanOrEqual(1);
        expect(stub!.data.numObjects).toBeLessThanOrEqual(10);
        expect(stub!.data.relation).toBe('most');
        
        const answer = stub!.data.answer;
        const cats = stub!.data.categories;
        const targetCount = cats[answer];
        
        const possibleCats = ['A', 'B', 'C'];
        possibleCats.forEach(cat => {
            if (cat !== answer) {
                expect(cats[cat]).toBeLessThan(targetCount);
            }
        });
    });

    it('should generate least relation when requested', () => {
        let stub = null;
        for (let seed = 42; seed < 100; seed++) {
            setSeed(seed);
            stub = generateWithLabels(generator, [
                Scope.NumbersSmaller10,
                Scope.Least
            ]);
            if (stub !== null) break;
        }
        
        expect(stub).not.toBeNull();
        expect(stub!.data.relation).toBe('least');
        
        const answer = stub!.data.answer;
        const cats = stub!.data.categories;
        const targetCount = cats[answer];
        
        const possibleCats = ['A', 'B', 'C'];
        possibleCats.forEach(cat => {
            if (cat !== answer) {
                expect(cats[cat]).toBeGreaterThan(targetCount);
            }
        });
    });
});
