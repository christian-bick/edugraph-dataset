import {describe, expect, it} from 'vitest';
import {createCanonicalNumericRange, hasCanonicalRangeWitness} from '../../../lib/canonical-numeric-range.ts';
import {random, setSeed} from '../../../lib/random.ts';
import {operationTableProblem, operationTableQuantities, operationTableRows} from './domain.ts';
import {ArithmeticOperationTableGenerator} from './generator.ts';

describe('ArithmeticOperationTableGenerator', () => {
    const generator = new ArithmeticOperationTableGenerator();

    it('validates required configuration and rejects unsupported operations', () => {
        expect(() => generator.generate({} as never)).toThrow();
        expect(generator.generate({operation: 'division', range: createCanonicalNumericRange(20)} as never)).toBeNull();
        expect(() => generator.generate({operation: 'addition', range: {min: 0, max: 10}} as never)).toThrow();
        expect(() => generator.generate({operation: 'addition', range: createCanonicalNumericRange(20, 5)})).toThrow();
        expect(() => generator.generate({operation: 'addition', range: createCanonicalNumericRange(5)})).toThrow();
    });

    it.each(['addition', 'multiplication'] as const)('computes the complete %s table including zero', operation => {
        const data = generator.generate({operation, range: createCanonicalNumericRange(20)})!.data;
        expect(data.operands).toEqual([0, 1, 2, 3, 4, 5, 6]);
        expect(data.values).toHaveLength(data.operands.length);
        data.values.forEach((row, i) => {
            expect(row).toHaveLength(data.operands.length);
            row.forEach((value, j) => expect(value).toBe(operation === 'addition'
                ? data.operands[i] + data.operands[j]
                : data.operands[i] * data.operands[j]));
        });
    });

    it('partitions every original table/row into exactly one of four canonical cells', () => {
        const expected = {addition: [10, 10, 10, 20], multiplication: [20, 20, 100, 100]};
        for (const operation of ['addition', 'multiplication'] as const) {
            for (const [index, row] of [2, 3, 4, 5].entries()) {
                const data = operationTableProblem(operation, row);
                expect(data.rowRelation).toEqual({fixedOperand: row, inputs: [0, 1, 2, 3, 4, 5, 6],
                    outputs: Array.from({length: 7}, (_, column) => operation === 'addition' ? row + column : row * column),
                    difference: operation === 'addition' ? 1 : row});
                const bands = [10, 20, 100].filter(max => hasCanonicalRangeWitness(operationTableQuantities(data), createCanonicalNumericRange(max)));
                expect(bands).toEqual([expected[operation][index]]);
                expect(Math.min(...operationTableQuantities(data))).toBe(0);
            }
        }
        expect(operationTableRows('addition', createCanonicalNumericRange(10))).toEqual([2, 3, 4]);
        expect(operationTableRows('addition', createCanonicalNumericRange(20))).toEqual([5]);
        expect(operationTableRows('multiplication', createCanonicalNumericRange(20))).toEqual([2, 3]);
        expect(operationTableRows('multiplication', createCanonicalNumericRange(100))).toEqual([4, 5]);
    });

    it('retains uniform conditional row selection and exactly one random draw per generated problem', () => {
        for (const operation of ['addition', 'multiplication'] as const) {
            for (const max of [10, 20, 100]) {
                const range = createCanonicalNumericRange(max), rows = operationTableRows(operation, range);
                if (!rows.length) {
                    expect(generator.generate({operation, range})).toBeNull();
                    continue;
                }
                for (let seed = 0; seed < 24; seed++) {
                    setSeed(seed);
                    const selected = rows[Math.floor(random() * rows.length)]!, continuation = random();
                    setSeed(seed);
                    expect(generator.generate({operation, range})!.data).toEqual(operationTableProblem(operation, selected));
                    expect(random()).toBe(continuation);
                }
            }
        }
    });
});
