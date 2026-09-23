import {Area} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {generateWithLabels} from '../../../lib/utils.ts';
import {ArithmeticOperationTableGenerator} from './generator.ts';

describe('ArithmeticOperationTableGenerator schema', () => {
    it.each([[Area.Addition, 'addition'], [Area.Multiplication, 'multiplication']] as const)(
        'resolves %s into a complete %s table', (label, operation) => {
            const problem = generateWithLabels(new ArithmeticOperationTableGenerator(), [label])!;
            expect(problem.data.operation).toBe(operation);
            expect(problem.labels).toEqual([label]);
        }
    );
});
