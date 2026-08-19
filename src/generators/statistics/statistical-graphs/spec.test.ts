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
        expect(data.scale).toBe(1);
        expect(data.task).toBe('categorical-data');
        expect(data.operation).toBeUndefined();
    });

    it.each([
        [Scope.StepsOf2, 2],
        [Scope.StepsOf5, 5],
        [Scope.StepsOf10, 10]
    ] as const)('resolves %s as a non-unit graph scale', (scaleLabel, scale) => {
        const data = generateWithLabels(new StatisticalGraphsGenerator(), [
            Area.Statistics,
            Scope.IntegerNumbers,
            Scope.PictureGraph,
            scaleLabel,
            Ability.VisualArticulation
        ])!.data;
        expect(data.scale).toBe(scale);
        expect(data.categories.every(({count}) => count % scale === 0)).toBe(true);
    });

    it.each([
        [Area.Addition, 'addition'],
        [Area.Subtraction, 'subtraction']
    ] as const)('resolves %s for a single-step graph question', (operationLabel, operation) => {
        const result = generateWithLabels(new StatisticalGraphsGenerator(), [
            Area.Statistics,
            Scope.IntegerNumbers,
            Scope.BarGraph,
            Scope.StepsOf1,
            Scope.SingleStep,
            Ability.ProcedureExecution,
            operationLabel
        ])!;
        expect(result.data.operation).toBe(operation);
        expect(result.tags).toEqual(expect.arrayContaining([Scope.SingleStep, operationLabel]));
    });

    it.each([
        [Scope.StepsOf2, 2],
        [Scope.StepsOf5, 5],
        [Scope.StepsOf10, 10]
    ] as const)('resolves a one-step subtraction comparison on the %s scale', (scaleLabel, scale) => {
        const data = generateWithLabels(new StatisticalGraphsGenerator(), [
            Area.Statistics,
            Area.Subtraction,
            Scope.IntegerNumbers,
            Scope.BarGraph,
            scaleLabel,
            Scope.SingleStep,
            Ability.ProcedureExecution
        ])!.data;
        const [firstIndex, secondIndex] = data.operandIndices!;
        const first = data.categories[firstIndex].count;
        const second = data.categories[secondIndex].count;

        expect(data.scale).toBe(scale);
        expect(data.operation).toBe('subtraction');
        expect(data.answer).toBe(first - second);
        expect(data.categories.every(({count}) => count % scale === 0)).toBe(true);
    });

    it('resolves a connected multi-step scaled subtraction comparison', () => {
        const result = generateWithLabels(new StatisticalGraphsGenerator(), [
            Area.Statistics,
            Area.Subtraction,
            Scope.IntegerNumbers,
            Scope.BarGraph,
            Scope.StepsOf5,
            Scope.MultiStep,
            Ability.ProcedureExecution
        ])!;
        if (result.data.operandIndices?.length !== 3) throw new Error('Expected three operand indices.');
        const [firstIndex, secondIndex, thirdIndex] = result.data.operandIndices;
        const [first, second, third] = [firstIndex, secondIndex, thirdIndex]
            .map(index => result.data.categories[index].count);

        expect(result.data.intermediate).toBe(first - second);
        expect(result.data.answer).toBe(result.data.intermediate! - third);
        expect(result.tags).toEqual(expect.arrayContaining([Area.Subtraction, Scope.MultiStep]));
    });

    it('resolves object sorting plus concept classification as organize', () => {
        const result = generateWithLabels(new StatisticalGraphsGenerator(), [
            Area.Statistics,
            Area.ObjectSorting,
            Scope.IntegerNumbers,
            Scope.PictureGraph,
            Scope.StepsOf1,
            Ability.ConceptClassification,
            Ability.VisualArticulation
        ])!;
        expect(result.data.task).toBe('organize');
        expect(result.data.rawObservations).toBeDefined();
        expect(result.tags).toEqual(expect.arrayContaining([
            Area.ObjectSorting
        ]));
        expect(result.tags).not.toContain(Ability.ConceptClassification);
    });

    it('resolves interpretation as read-category-count', () => {
        const result = generateWithLabels(new StatisticalGraphsGenerator(), [
            Area.Statistics,
            Scope.IntegerNumbers,
            Scope.BarGraph,
            Scope.StepsOf1,
            Ability.Interpretation
        ])!;
        expect(result.data.task).toBe('categorical-data');
        expect(result.data.answer).toBe(
            result.data.categories[result.data.selectedCategoryIndex!].count
        );
        expect(result.tags).not.toContain(Ability.Interpretation);
    });

    it('resolves three-operand addition as find-total', () => {
        const result = generateWithLabels(new StatisticalGraphsGenerator(), [
            Area.Statistics,
            Area.Addition,
            Scope.IntegerNumbers,
            Scope.PictureGraph,
            Scope.ThreeOperands,
            Scope.StepsOf1,
            Ability.ProcedureExecution
        ])!;
        expect(result.data.task).toBe('find-total');
        expect(result.data.operandIndices).toEqual([0, 1, 2]);
        expect(result.tags).toEqual(expect.arrayContaining([Area.Addition, Scope.ThreeOperands]));
    });
});
