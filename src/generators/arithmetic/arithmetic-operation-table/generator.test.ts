import {describe, expect, it} from 'vitest';
import {ArithmeticOperationTableGenerator} from './generator.ts';

describe('ArithmeticOperationTableGenerator', () => {
    const generator = new ArithmeticOperationTableGenerator();

    it('validates required configuration and rejects unsupported operations', () => {
        expect(() => generator.generate({} as never)).toThrow();
        expect(generator.generate({operation: 'division'} as never)).toBeNull();
    });

    it.each(['addition', 'multiplication'] as const)('computes the complete %s table including zero', operation => {
        const data = generator.generate({operation})!.data;
        expect(data.operands).toEqual([0, 1, 2, 3, 4, 5, 6]);
        expect(data.values).toHaveLength(data.operands.length);
        data.values.forEach((row, i) => {
            expect(row).toHaveLength(data.operands.length);
            row.forEach((value, j) => expect(value).toBe(operation === 'addition'
                ? data.operands[i] + data.operands[j]
                : data.operands[i] * data.operands[j]));
        });
    });
});
