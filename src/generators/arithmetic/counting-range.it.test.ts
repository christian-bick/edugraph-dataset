import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {describe, expect, it} from 'vitest';
import {createCanonicalNumericRange, hasCanonicalRangeWitness} from '../../lib/canonical-numeric-range.ts';
import type {AdditionCountingOnProblem, SubtractionCountingBackProblem} from '../../types/problems.ts';
import {OperationsAddSubtractStrategyView} from '../../visuals/views/operations/operations-add-subtract-strategy-view.tsx';
import {
    formatOperationRelationship,
    getIntegerAddSubtractStrategyPresentation,
    maskEquationResult
} from '../../visuals/views/operations/operations-add-subtract-strategy-helpers.ts';

/** Independent positive support: two operands, a positive answer and 1..3 unit steps. */
const problems = (operation: 'addition' | 'subtraction', upper: 5 | 10 | 20) => {
    const previous = upper === 5 ? 0 : upper === 10 ? 5 : 10;
    const result: (AdditionCountingOnProblem | SubtractionCountingBackProblem)[] = [];
    for (let right = 1; right <= 3; right++) for (let low = 1; low + right <= upper; low++) {
        const high = low + right;
        if (high <= previous) continue;
        const leftOperand = operation === 'addition' ? low : high;
        result.push({
            task: 'integer-add-subtract-strategy',
            strategy: operation === 'addition' ? 'addition-counting-on' : 'subtraction-counting-back',
            operation,
            leftOperand,
            rightOperand: right,
            answer: operation === 'addition' ? high : low,
            adjustment: right,
            steps: Array.from({length: right}, (_, index) => ({
                kind: 'operation', operation,
                leftOperand: leftOperand + (operation === 'addition' ? index : -index),
                rightOperand: 1,
                result: leftOperand + (operation === 'addition' ? index + 1 : -index - 1)
            }))
        });
    }
    return result;
};

const consumers = [
    {operation: 'addition', viewId: 'operations-counting-on-operation-derivation', mode: 'counting-derivation'},
    {operation: 'subtraction', viewId: 'operations-counting-back-operation-derivation', mode: 'counting-derivation'},
    {operation: 'addition', viewId: 'operations-add-subtract-strategy-understanding', mode: 'understanding'}
] as const;

describe('canonical counting ranges across every current consumer', () => {
    it.each(consumers)('preserves the complete finite support in $viewId in both modes', consumer => {
        let rendered = 0;
        for (const upper of [5, 10, 20] as const) {
            const range = createCanonicalNumericRange(upper);
            const cases = problems(consumer.operation, upper);
            expect(cases).toHaveLength(upper === 5 ? 9 : upper === 10 ? 15 : 30);
            for (const data of cases) {
                const quantities = [data.leftOperand, data.rightOperand, data.answer,
                    ...data.steps.flatMap(step => step.kind === 'operation'
                        ? [step.leftOperand, step.rightOperand, step.result] : [step.whole, ...step.parts])];
                expect(hasCanonicalRangeWitness(quantities, range)).toBe(true);
                expect(quantities).toContain(1);
                const presentation = getIntegerAddSubtractStrategyPresentation(data);
                for (const isSolutionView of [false, true]) {
                    const markup = renderToStaticMarkup(createElement(OperationsAddSubtractStrategyView, {
                        mode: consumer.mode, viewId: consumer.viewId,
                        expectedCountingStrategy: data.strategy,
                        payload: {viewId: consumer.viewId, problem: {type: 'arithmetic', data, labels: []},
                            isSolutionView, seed: 0} as never
                    }));
                    const text = markup.replace(/<[^>]*>/g, ' ');
                    for (const step of presentation.steps) {
                        expect(text).toContain(consumer.mode === 'counting-derivation' || isSolutionView
                            ? step : maskEquationResult(step));
                    }
                    if (consumer.mode === 'counting-derivation') {
                        expect(text).toContain(formatOperationRelationship(data, isSolutionView));
                    } else {
                        expect(text).toContain(presentation.transformedEquation);
                        expect(text).toContain(isSolutionView ? presentation.solutionEquation : presentation.questionEquation);
                    }
                    expect(text.includes(presentation.explanation)).toBe(isSolutionView);
                    rendered++;
                }
            }
        }
        expect(rendered).toBe(108);
    });
});
