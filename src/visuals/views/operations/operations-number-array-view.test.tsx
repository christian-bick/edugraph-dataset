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
const fiveByThree: NumberArrayProblem = {
    operation: 'multiplication', groupCount: 5, groupSize: 3, rows: 5, columns: 3,
    total: 15, answer: 15, addends: [3, 3, 3, 3, 3]
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
    it('withholds the five-by-three interpretation while keeping the complete array visible', () => {
        const viewId = 'operations-number-array-interpretation';
        const question = render('interpretation', viewId, fiveByThree, false);
        const solution = render('interpretation', viewId, fiveByThree, true);
        const questionText = question.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ');
        expect(questionText).toContain('What does 5 × 3 mean for the whole set shown?');
        expect(questionText).toContain('Explain what each factor and the product represent.');
        expect(questionText).not.toContain('15');
        expect(questionText).not.toMatch(/5 equal rows|rows of 3|5 × 3 = 15|The whole set is partitioned/);
        expect(question).not.toContain('text-emerald-700');
        expect(solution).toMatch(/class="[^"]*text-emerald-700[^"]*"[^>]*>The whole set is partitioned into 5 equal rows of 3, so 5 × 3 = 15\./);
        for (const markup of [question, solution]) {
            expect(markup).toContain('aria-label="5 rows by 3 columns"');
            expect(markup.match(/class="size-6 rounded-full bg-indigo-500"/g)).toHaveLength(15);
        }
        const array = (markup: string) => markup.slice(markup.indexOf('<div class="grid gap-3"'),
            markup.indexOf('<div class="mt-5'));
        expect(array(question)).toBe(array(solution));
    });

    it.each([
        ['addition', 15, '5 equal rows of 3 can be added as 3 + 3 + 3 + 3 + 3 to make 15.'],
        ['multiplication', 15, 'The whole set is partitioned into 5 equal rows of 3, so 5 × 3 = 15.'],
        ['partitive-division', 3, '15 ÷ 5 = 3 objects in each row.'],
        ['quotative-division', 5, '15 ÷ 3 = 5 equal rows.']
    ] as const)('styles only the completed %s interpretation in green and preserves its explanation', (operation, answer, interpretation) => {
        const data: NumberArrayProblem = {...fiveByThree, operation, answer};
        const question = render('interpretation', 'operations-number-array-interpretation', data, false);
        const solution = render('interpretation', 'operations-number-array-interpretation', data, true);
        const answerSpan = solution.match(/<span class="[^"]*text-emerald-700[^"]*">([^<]*)<\/span>/);
        expect(answerSpan?.[1]).toBe(interpretation);
        expect(question).not.toContain('text-emerald-700');
        expect(question).not.toContain(interpretation);
    });

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
