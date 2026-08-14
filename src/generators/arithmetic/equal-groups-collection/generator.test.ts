import {describe, expect, it} from 'vitest';
import {setSeed} from '../../../lib/random.ts';
import {EqualGroupsCollectionGenerator} from './generator.ts';

describe('EqualGroupsCollectionGenerator', () => {
    const generator = new EqualGroupsCollectionGenerator();

    it('validates its required configuration', () => {
        expect(() => generator.generate({} as never)).toThrow();
    });

    it.each([
        ['multiplication', 'total'],
        ['partitive-division', 'groupSize'],
        ['quotative-division', 'groupCount']
    ] as const)('generates valid %s collections', (operation, answerField) => {
        for (let seed = 0; seed < 40; seed++) {
            setSeed(seed);
            const data = generator.generate({operation}).data;
            expect(data.groupCount).toBeGreaterThanOrEqual(2);
            expect(data.groupCount).toBeLessThanOrEqual(6);
            expect(data.groupSize).toBeGreaterThanOrEqual(2);
            expect(data.groupSize).toBeLessThanOrEqual(6);
            expect(data.total).toBe(data.groupCount * data.groupSize);
            expect(data.total).toBeLessThan(100);
            expect(data.answer).toBe(data[answerField]);
        }
    });
});
