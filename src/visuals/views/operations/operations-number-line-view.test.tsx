import {renderToStaticMarkup} from 'react-dom/server';
import {describe, expect, it} from 'vitest';
import {ViewRenderPayload} from '../../../types/ml-engine.ts';
import {ArithmeticPairProblem, WritingProblem} from '../../../types/problems.ts';
import {
    OperationsNumberLineMode,
    OperationsNumberLineView,
    OperationsNumberLineViewId
} from './operations-number-line-view.tsx';

const payload = (
    viewId: OperationsNumberLineViewId,
    data: WritingProblem | ArithmeticPairProblem,
    isSolutionView: boolean
): ViewRenderPayload<OperationsNumberLineViewId> => ({
    problem: {type: 'arithmetic', data, labels: []},
    viewId,
    targetLabels: [],
    isSolutionView,
    seed: 1
});

const render = (
    mode: OperationsNumberLineMode,
    viewId: OperationsNumberLineViewId,
    data: WritingProblem | ArithmeticPairProblem,
    isSolutionView: boolean
) => renderToStaticMarkup(<OperationsNumberLineView
    mode={mode}
    payload={payload(viewId, data, isSolutionView)}
    viewId={viewId}
/>);

describe('operations number line view family', () => {
    it('keeps representation and arithmetic as distinct requested responses', () => {
        const representation = render(
            'representation',
            'operations-number-line-representation',
            {number: 37},
            false
        );
        const arithmetic = render(
            'arithmetic',
            'operations-number-line-arithmetic',
            {num1: 31, num2: 24, answer: 55, operation: 'addition'},
            false
        );
        expect(representation).toContain('Mark 37 as a length from 0.');
        expect(representation).not.toContain('Use the number line:');
        expect(arithmetic).toContain('Use the number line: 31 + 24 = □');
        expect(arithmetic).not.toContain('Mark 55');
    });

    it.each([
        ['addition', 31, 24, 55],
        ['subtraction', 55, 24, 31]
    ] as const)('renders coherent %s arithmetic', (operation, num1, num2, answer) => {
        expect(() => render(
            'arithmetic',
            'operations-number-line-arithmetic',
            {num1, num2, answer, operation},
            true
        )).not.toThrow();
    });

    it('rejects an unsupported arithmetic operation', () => {
        expect(() => render(
            'arithmetic',
            'operations-number-line-arithmetic',
            {num1: 3, num2: 4, answer: 12, operation: 'multiplication'},
            false
        )).toThrow('Unsupported operation');
    });
});
