import {describe, expect, it} from 'vitest';
import {setSeed} from '../../../lib/random.ts';
import {ArithmeticEquationJudgmentGenerator} from './generator.ts';

describe('ArithmeticEquationJudgmentGenerator', () => {
    const generator = new ArithmeticEquationJudgmentGenerator();

    it('strictly validates configuration', () => {
        expect(() => generator.generate({} as any)).toThrow();
        expect(() => generator.generate({relation: 'addition-positive'} as any)).toThrow();
    });

    it('rejects unsupported operations and impossible ranges', () => {
        expect(generator.generate({
            relation: 'multiplication-positive' as any,
            range: {min: 1, max: 20}
        })).toBeNull();
        expect(generator.generate({
            relation: 'addition-positive',
            range: {min: 5, max: 2}
        })).toBeNull();
        expect(generator.generate({
            relation: 'addition-positive',
            range: {min: 10, max: 10}
        })).toBeNull();
    });

    it('generates exact relations and their canonical mathematical claims without selecting a learner action', () => {
        for (const relation of ['addition-positive', 'subtraction-positive'] as const) {
            for (let seed = 0; seed < 50; seed++) {
                setSeed(seed);
                const stub = generator.generate({
                    relation,
                    range: {min: 0, max: 20}
                });
                expect(stub).not.toBeNull();
                const data = stub!.data;
                const actual = data.operation === 'addition'
                    ? data.num1 + data.num2
                    : data.num1 - data.num2;
                expect(data.answer).toBe(actual);
                expect([data.num1, data.num2, data.answer, data.claimedAnswer].every(value => value > 0 && value <= 20)).toBe(true);
                expect(data).not.toHaveProperty('isTrue');
            }
        }
    });

    it('includes a zero witness when requested', () => {
        for (const relation of ['addition-zero', 'subtraction-zero'] as const) {
            const stub = generator.generate({
                relation,
                range: {min: 0, max: 20}
            });
            expect(stub).not.toBeNull();
            expect([stub!.data.num1, stub!.data.num2, stub!.data.answer, stub!.data.claimedAnswer]
                .includes(0)).toBe(true);
        }
    });
});
