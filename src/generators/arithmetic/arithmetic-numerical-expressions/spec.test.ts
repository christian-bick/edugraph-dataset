import {Area, Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {normalizeSchemaChoices, resolveSchemaChoices} from '../../../lib/schema-choices.ts';
import {generateWithLabels} from '../../../lib/utils.ts';
import {ArithmeticNumericalExpressionsGenerator} from './generator.ts';
import {ArithmeticNumericalExpressionsGeneratorSchema, spec} from './spec.ts';

const groupedLabels = [Area.GroupedExpression, Area.OrderOfOperations].sort();

describe('ArithmeticNumericalExpressionsGenerator schema', () => {
    it('keeps only numerical-expression mathematics invariant', () => {
        expect(spec.generalLabels).toEqual([Area.NumericalExpression]);
        expect(spec.generalLabels).not.toContain(Scope.ArabicNumerals);
    });

    it('admits both structure choices for a general expression and only grouping for an explicit grouped target', () => {
        const broad = normalizeSchemaChoices(ArithmeticNumericalExpressionsGeneratorSchema,
            [Area.NumericalExpression], 'generator');
        expect(broad[0].alternatives.map(choice => choice.labels)).toEqual(expect.arrayContaining([[], groupedLabels]));
        expect(broad[0].alternatives).toHaveLength(2);

        const grouped = normalizeSchemaChoices(ArithmeticNumericalExpressionsGeneratorSchema,
            [Area.NumericalExpression, ...groupedLabels], 'generator');
        expect(grouped[0].alternatives.map(choice => choice.labels)).toEqual([groupedLabels]);
        expect(broad[0].alternatives.every(choice => choice.priority === 0)).toBe(true);
    });

    it('resolves joint grouping without claiming it for ungrouped instances', () => {
        const broad = [Area.NumericalExpression];
        expect(resolveSchemaChoices(ArithmeticNumericalExpressionsGeneratorSchema, broad,
            {structure: []})).toEqual({config: {structure: 'ungrouped'}, resolvedLabels: []});
        expect(resolveSchemaChoices(ArithmeticNumericalExpressionsGeneratorSchema, broad,
            {structure: groupedLabels})).toEqual({config: {structure: 'grouped'}, resolvedLabels: groupedLabels});
    });

    it('generates the grouped model from the complete requested Area conjunction', () => {
        const problem = generateWithLabels(new ArithmeticNumericalExpressionsGenerator(), [
            Area.NumericalExpression, ...groupedLabels
        ])!;
        expect(problem.data.expression.kind).toBe('operation');
        expect(problem.data.multiplicativeComparison).toBeDefined();
        expect(problem.labels).toEqual(groupedLabels);
    });
});
