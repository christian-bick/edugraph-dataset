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
        expect(data.operation).toBeUndefined();
        expect(data.answer).toBeUndefined();
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
        const [firstId, secondId] = data.operandCategoryIds!;
        const first = data.categories.find(category => category.id === firstId)!.count;
        const second = data.categories.find(category => category.id === secondId)!.count;

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
        if (result.data.operandCategoryIds?.length !== 3) throw new Error('Expected three operand category IDs.');
        const [firstId, secondId, thirdId] = result.data.operandCategoryIds;
        const [first, second, third] = [firstId, secondId, thirdId]
            .map(id => result.data.categories.find(category => category.id === id)!.count);

        expect(result.data.intermediate).toBe(first - second);
        expect(result.data.answer).toBe(result.data.intermediate! - third);
        expect(result.tags).toEqual(expect.arrayContaining([Area.Subtraction, Scope.MultiStep]));
    });

    it('resolves object sorting as canonical observation evidence without consuming Ability', () => {
        const result = generateWithLabels(new StatisticalGraphsGenerator(), [
            Area.Statistics,
            Area.ObjectSorting,
            Scope.IntegerNumbers,
            Scope.PictureGraph,
            Scope.StepsOf1,
            Ability.ConceptClassification,
            Ability.VisualArticulation
        ])!;
        expect(result.data.categories.map(({id}) => id)).toEqual(['apple', 'book', 'kite']);
        expect(Object.keys(result.data).sort()).toEqual(['categories', 'scale']);
        expect(result.tags).toEqual(expect.arrayContaining([
            Area.ObjectSorting
        ]));
        expect(result.tags).not.toContain(Ability.ConceptClassification);
    });

    it('leaves interpretation and category selection to the view', () => {
        const result = generateWithLabels(new StatisticalGraphsGenerator(), [
            Area.Statistics,
            Scope.IntegerNumbers,
            Scope.BarGraph,
            Scope.StepsOf1,
            Ability.Interpretation
        ])!;
        expect(result.data.operation).toBeUndefined();
        expect(result.data.answer).toBeUndefined();
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
        expect(result.data.operandCategoryIds).toEqual(['apple', 'book', 'kite']);
        expect(result.tags).toEqual(expect.arrayContaining([Area.Addition, Scope.ThreeOperands]));
    });
});
