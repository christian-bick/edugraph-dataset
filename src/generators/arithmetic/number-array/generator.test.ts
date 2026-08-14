import {describe, expect, it} from 'vitest';
import {setSeed} from '../../../lib/random.ts';
import {NumberArrayGenerator} from './generator.ts';

describe('NumberArrayGenerator', () => {
    const generator = new NumberArrayGenerator();

    it('validates its required configuration', () => {
        expect(() => generator.generate({} as never)).toThrow();
    });

    it('generates rectangular arrays bounded by five rows and columns', () => {
        for (let seed = 0; seed < 40; seed++) {
            setSeed(seed);
            const data = generator.generate({
                operation: 'addition',
                requireTwoOperands: false,
                requireIteratedOperation: false
            }).data;
            expect(data.rows).toBeGreaterThanOrEqual(2);
            expect(data.rows).toBeLessThanOrEqual(5);
            expect(data.columns).toBeGreaterThanOrEqual(2);
            expect(data.columns).toBeLessThanOrEqual(5);
            expect(data.total).toBe(data.rows * data.columns);
            expect(data.addends).toEqual(Array.from({length: data.rows}, () => data.columns));
        }
    });

    it('uses at least three equal addends for iterated-operation arrays', () => {
        for (let seed = 0; seed < 40; seed++) {
            setSeed(seed);
            const data = generator.generate({
                operation: 'addition',
                requireTwoOperands: false,
                requireIteratedOperation: true
            }).data;
            expect(data.rows).toBeGreaterThanOrEqual(3);
            expect(data.addends).toHaveLength(data.rows);
            expect(new Set(data.addends)).toEqual(new Set([data.columns]));
        }
    });

    it.each([
        ['multiplication', 'total'],
        ['partitive-division', 'groupSize'],
        ['quotative-division', 'groupCount']
    ] as const)('maps %s to the correct equal-groups answer', (operation, answerField) => {
        for (let seed = 0; seed < 20; seed++) {
            setSeed(seed);
            const data = generator.generate({
                operation,
                requireTwoOperands: true,
                requireIteratedOperation: false
            }).data;
            expect(data.answer).toBe(data[answerField]);
            expect(data.total).toBe(data.groupCount * data.groupSize);
            expect(data.rows).toBe(data.groupCount);
            expect(data.columns).toBe(data.groupSize);
        }
    });

    it('uses exactly two addends for binary addition targets', () => {
        for (let seed = 0; seed < 20; seed++) {
            setSeed(seed);
            const data = generator.generate({
                operation: 'addition',
                requireTwoOperands: true,
                requireIteratedOperation: false
            }).data;
            expect(data.rows).toBe(2);
            expect(data.addends).toHaveLength(2);
        }
    });
});
