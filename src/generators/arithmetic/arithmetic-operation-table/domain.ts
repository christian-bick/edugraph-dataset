import {hasCanonicalRangeWitness, type CanonicalNumericRange} from '../../../lib/canonical-numeric-range.ts';
import type {ArithmeticOperationTablePatternProblem, ArithmeticPatternOperation} from '../../../types/problems.ts';

const operands = [0, 1, 2, 3, 4, 5, 6];
const rows = [2, 3, 4, 5];

export function operationTableProblem(operation: ArithmeticPatternOperation, fixedOperand: number): ArithmeticOperationTablePatternProblem {
    const values = operands.map(row => operands.map(column => operation === 'addition' ? row + column : row * column));
    return {kind: 'operation-table', operation, operands: [...operands], values,
        rowRelation: {fixedOperand, inputs: [...operands], outputs: [...values[fixedOperand]!],
            difference: operation === 'addition' ? 1 : fixedOperand}};
}

/** Only the row under study supplies inputs/results; other table rows remain reference context. */
export const operationTableQuantities = (data: ArithmeticOperationTablePatternProblem): number[] =>
    [data.rowRelation.fixedOperand, ...data.rowRelation.inputs, ...data.rowRelation.outputs, data.rowRelation.difference];

export const operationTableRows = (operation: ArithmeticPatternOperation, range: CanonicalNumericRange): readonly number[] =>
    rows.filter(row => hasCanonicalRangeWitness(operationTableQuantities(operationTableProblem(operation, row)), range));
