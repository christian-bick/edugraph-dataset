import {renderToStaticMarkup} from 'react-dom/server';
import {describe, expect, it} from 'vitest';
import {ViewRenderPayload} from '../../../types/ml-engine.ts';
import {NumberArrayProblem} from '../../../types/problems.ts';
import {
    OperationsNumberArrayMode,
    OperationsNumberArrayView,
    OperationsNumberArrayViewId
} from './operations-number-array-view.tsx';

const addition: NumberArrayProblem = {
    operation: 'addition',
    groupCount: 3,
    groupSize: 4,
    rows: 3,
    columns: 4,
    total: 12,
    answer: 12,
    addends: [4, 4, 4]
};

const payload = (
    viewId: OperationsNumberArrayViewId,
    data: NumberArrayProblem,
    isSolutionView: boolean
): ViewRenderPayload<OperationsNumberArrayViewId> => ({
    problem: {type: 'arithmetic', data, labels: []},
    viewId,
    targetLabels: [],
    isSolutionView,
    seed: 1
});

const render = (
    mode: OperationsNumberArrayMode,
    viewId: OperationsNumberArrayViewId,
    data: NumberArrayProblem,
    isSolutionView: boolean
): string => renderToStaticMarkup(<OperationsNumberArrayView
    mode={mode}
    payload={payload(viewId, data, isSolutionView)}
    viewId={viewId}
/>);

describe('operations number array view family', () => {
    it('withholds the complete equation in formalization Question Mode', () => {
        const viewId = 'operations-number-array-equation-formalization';
        const question = render('formalization', viewId, addition, false);
        const solution = render('formalization', viewId, addition, true);
        expect(question).not.toContain('4 + 4 + 4 = 12');
        expect(question).toContain('Write the complete equation.');
        expect(solution).toContain('4 + 4 + 4 = 12');
    });

    it('keeps execution and interpretation as distinct requested responses', () => {
        const execution = render(
            'execution',
            'operations-number-array-total',
            addition,
            false
        );
        const interpretation = render(
            'interpretation',
            'operations-number-array-interpretation',
            addition,
            false
        );
        expect(execution).toContain('Determine the total number of objects');
        expect(execution).toContain('4 + 4 + 4 = ?');
        expect(execution).not.toContain('4 + 4 + 4 = 12');
        expect(interpretation).toContain('Explain how the equal rows represent repeated addition');
        expect(interpretation).toContain('Use the rows and objects in each row to explain.');
    });

    it('makes the operation and operands visible in execution Question and Solution modes', () => {
        const additionQuestion = render(
            'execution',
            'operations-number-array-total',
            addition,
            false
        );
        const additionSolution = render(
            'execution',
            'operations-number-array-total',
            addition,
            true
        );
        const multiplication: NumberArrayProblem = {
            ...addition,
            operation: 'multiplication'
        };
        const multiplicationQuestion = render(
            'execution',
            'operations-number-array-total',
            multiplication,
            false
        );

        expect(additionQuestion).toContain('4 + 4 + 4 = ?');
        expect(additionSolution).toContain('4 + 4 + 4 = 12');
        expect(multiplicationQuestion).toContain('3 × 4 = ?');
    });

    it.each([
        ['multiplication', 3, 4, 12, 12],
        ['partitive-division', 3, 4, 12, 4],
        ['quotative-division', 3, 4, 12, 3]
    ] as const)('renders every mode for %s', (operation, rows, columns, total, answer) => {
        const data: NumberArrayProblem = {
            operation,
            groupCount: rows,
            groupSize: columns,
            rows,
            columns,
            total,
            answer,
            addends: [columns, columns, columns]
        };
        expect(() => render(
            'execution',
            'operations-number-array-total',
            data,
            false
        )).not.toThrow();
        expect(() => render(
            'formalization',
            'operations-number-array-equation-formalization',
            data,
            false
        )).not.toThrow();
        expect(() => render(
            'interpretation',
            'operations-number-array-interpretation',
            data,
            false
        )).not.toThrow();
    });
});
