import {Ability, Area, Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {generateWithLabels} from '../../../lib/utils.ts';
import {StatisticalGraphsGenerator} from './generator.ts';

describe('statistical-graphs spec', () => {
    it('generates presentation-only graph data without an arithmetic question', () => {
        const data = generateWithLabels(new StatisticalGraphsGenerator(), [
            Area.Statistics,
            Scope.IntegerNumbers,
            Scope.PictureGraph,
            Scope.StepsOf1,
            Ability.VisualArticulation
        ])!.data;
        expect(data.operation).toBeUndefined();
    });

    it.each([
        [Area.Addition, 'addition'],
        [Area.Subtraction, 'subtraction']
    ] as const)('resolves %s for a two-operand graph question', (operationLabel, operation) => {
        const result = generateWithLabels(new StatisticalGraphsGenerator(), [
            Area.Statistics,
            Scope.IntegerNumbers,
            Scope.BarGraph,
            Scope.StepsOf1,
            Scope.TwoOperands,
            Ability.ProcedureExecution,
            operationLabel
        ])!;
        expect(result.data.operation).toBe(operation);
        expect(result.tags).toEqual(expect.arrayContaining([Scope.TwoOperands, operationLabel]));
    });
});
