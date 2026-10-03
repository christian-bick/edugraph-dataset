import {renderToStaticMarkup} from 'react-dom/server';
import {describe, expect, it} from 'vitest';
import type {ViewRenderPayload} from '../../../types/ml-engine.ts';
import type {NumericalExpressionProblem} from '../../../types/problems.ts';
import {
    NumericalExpressionMode,
    NumericalExpressionViewId,
    OperationsNumericalExpressionView
} from './operations-numerical-expression-view.tsx';
import {
    describeNumericalExpression,
    expressionEvaluationSteps,
    formatNumericalExpression,
    validateNumericalExpression
} from './operations-numerical-expression-helpers.ts';

const reference = {
    kind: 'operation' as const,
    operation: 'addition' as const,
    left: {kind: 'number' as const, value: 5},
    right: {kind: 'number' as const, value: 2},
    value: 7
};

const grouped: NumericalExpressionProblem = {
    expression: {
        kind: 'operation', operation: 'multiplication',
        left: {kind: 'number', value: 3},
        right: {kind: 'group', expression: reference, value: 7},
        value: 21
    },
    multiplicativeComparison: {factor: 3, reference}
};

const ungrouped: NumericalExpressionProblem = {
    expression: {
        kind: 'operation', operation: 'addition',
        left: {kind: 'number', value: 8},
        right: {kind: 'number', value: 5},
        value: 13
    }
};

const ungroupedComparisonReference = {
    kind: 'operation' as const, operation: 'multiplication' as const,
    left: {kind: 'number' as const, value: 4},
    right: {kind: 'number' as const, value: 6},
    value: 24
};

const ungroupedComparison: NumericalExpressionProblem = {
    expression: {
        kind: 'operation', operation: 'multiplication',
        left: {kind: 'number', value: 3},
        right: ungroupedComparisonReference,
        value: 72
    },
    multiplicativeComparison: {factor: 3, reference: ungroupedComparisonReference}
};

const visibleText = (markup: string): string => markup.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ');

const render = (
    mode: NumericalExpressionMode,
    viewId: NumericalExpressionViewId,
    data: NumericalExpressionProblem,
    isSolutionView = false,
    seed = 0
) => {
    const payload: ViewRenderPayload<NumericalExpressionViewId> = {
        problem: {type: 'arithmetic', data, labels: []},
        viewId, targetLabels: [], isSolutionView, seed
    };
    return renderToStaticMarkup(<OperationsNumericalExpressionView
        mode={mode} payload={payload} viewId={viewId}
    />);
};

describe('numerical expression view family', () => {
    it('requires learner-added grouping and never displays the evaluated values in writing modes', () => {
        const question = render('grouping-write', 'operations-grouping-write', grouped);
        const solution = render('grouping-write', 'operations-grouping-write', grouped, true);
        expect(question).toContain('3 × 5 + 2');
        expect(question).toContain('the product of 3 and the sum of 5 and 2');
        expect(question).not.toContain('3 × (5 + 2)');
        expect(solution).toContain('3 × (5 + 2)');
        expect(solution).not.toContain('21');
        expect(solution).not.toContain('= 7');
    });

    it('shows the grouped expression first and its calculation steps only in evaluation solution', () => {
        const question = render('grouping-evaluate', 'operations-grouping-evaluate', grouped);
        const solution = render('grouping-evaluate', 'operations-grouping-evaluate', grouped, true);
        expect(question).toContain('3 × (5 + 2)');
        expect(question).not.toContain('21');
        expect(solution).toContain('5 + 2 = 7');
        expect(solution).toContain('3 × 7 = 21');
        expect(solution.indexOf('5 + 2 = 7')).toBeLessThan(solution.indexOf('3 × 7 = 21'));
    });

    it('writes an ungrouped expression from words without converting it into an equation', () => {
        const question = render('expression-write', 'operations-numerical-expression-write', ungrouped);
        const solution = render('expression-write', 'operations-numerical-expression-write', ungrouped, true);
        expect(question).toContain('the sum of 8 and 5');
        expect(question).not.toContain('8 + 5');
        expect(solution).toContain('8 + 5');
        expect(solution).not.toContain('13');
        expect(solution).not.toContain('8 + 5 =');
    });

    it('interprets a comparison by showing both expressions without evaluating either', () => {
        const question = render('expression-interpretation', 'operations-numerical-expression-interpretation', grouped);
        const solution = render('expression-interpretation', 'operations-numerical-expression-interpretation', grouped, true);
        expect(question).toContain('Reference expression');
        expect(question).toContain('Compared expression');
        expect(question).toContain('5 + 2');
        expect(question).toContain('3 × (5 + 2)');
        expect(solution).toContain('3 times the sum of 5 and 2');
        expect(solution).toContain('grouping symbols keep the reference expression together');
        expect(solution).not.toContain('21');
        expect(solution).not.toContain('= 7');
    });

    it('explains an ungrouped multiplicative comparison without implying grouping or revealing values', () => {
        const question = visibleText(render(
            'expression-interpretation',
            'operations-numerical-expression-interpretation',
            ungroupedComparison
        ));
        const solution = visibleText(render(
            'expression-interpretation',
            'operations-numerical-expression-interpretation',
            ungroupedComparison,
            true
        ));
        expect(question).toContain('Reference expression 4 × 6');
        expect(question).toContain('Compared expression 3 × 4 × 6');
        expect(question).toContain('Explain how the compared expression relates to the reference expression');
        expect(solution).toContain('3 times the product of 4 and 6');
        expect(solution).not.toContain('grouping symbols');
        expect(question).not.toContain('24');
        expect(question).not.toContain('72');
        expect(solution).not.toContain('24');
        expect(solution).not.toContain('72');
    });

    it('does not ask about absent grouping in a simple interpretation', () => {
        const question = render('expression-interpretation', 'operations-numerical-expression-interpretation', ungrouped);
        expect(question).toContain('Explain what the operations mean');
        expect(question).not.toContain('operations and grouping mean');
    });

    it('uses seed-only punctuation variants for the same grouped mathematics', () => {
        expect(formatNumericalExpression(grouped.expression, 0)).toBe('3 × (5 + 2)');
        expect(formatNumericalExpression(grouped.expression, 1)).toBe('3 × [5 + 2]');
        expect(formatNumericalExpression(grouped.expression, 2)).toBe('3 × {5 + 2}');
    });

    it('handles division from the shared expression type without computing in interpretation', () => {
        const division = {
            kind: 'operation' as const, operation: 'division' as const,
            left: {kind: 'number' as const, value: 12},
            right: {kind: 'number' as const, value: 3}, value: 4
        };
        expect(formatNumericalExpression(division, 0)).toBe('12 ÷ 3');
        expect(describeNumericalExpression(division)).toBe('the quotient of 12 and 3');
        expect(expressionEvaluationSteps(division)).toEqual([{
            calculation: '12 ÷ 3 = 4', inGroup: false
        }]);
    });

    it('rejects inconsistent values and missing grouping in grouped tasks', () => {
        const invalid: NumericalExpressionProblem = {
            expression: {...ungrouped.expression, value: 20}
        };
        expect(() => validateNumericalExpression('operations-numerical-expression-write', invalid))
            .toThrow('mathematically inconsistent');
        expect(() => render('grouping-write', 'operations-grouping-write', ungrouped))
            .toThrow('requires an explicitly grouped expression');
    });
});
