import {ViewRenderPayload} from '../../../types/ml-engine.ts';
import {NumberArrayProblem} from '../../../types/problems.ts';
import {validateProblemData, ViewValidationError} from '../../helpers/validation.ts';

export type OperationsNumberArrayMode = 'execution' | 'formalization' | 'interpretation';
export type OperationsNumberArrayViewId =
    | 'operations-number-array-total'
    | 'operations-number-array-equation-formalization'
    | 'operations-number-array-interpretation';

interface OperationsNumberArrayViewProps {
    mode: OperationsNumberArrayMode;
    payload: ViewRenderPayload<OperationsNumberArrayViewId>;
    viewId: OperationsNumberArrayViewId;
}

const equationFor = (data: NumberArrayProblem): string => {
    if (data.operation === 'addition') {
        return `${data.addends.join(' + ')} = ${data.total}`;
    }
    if (data.operation === 'multiplication') {
        return `${data.groupCount} × ${data.groupSize} = ${data.total}`;
    }
    if (data.operation === 'partitive-division') {
        return `${data.total} ÷ ${data.groupCount} = ${data.groupSize}`;
    }
    return `${data.total} ÷ ${data.groupSize} = ${data.groupCount}`;
};

const interpretationFor = (data: NumberArrayProblem): string => {
    if (data.operation === 'addition') {
        return `${data.groupCount} equal rows of ${data.groupSize} can be added as ${data.addends.join(' + ')} to make ${data.total}.`;
    }
    if (data.operation === 'multiplication') {
        return `The whole set is partitioned into ${data.groupCount} equal rows of ${data.groupSize}, so ${data.groupCount} × ${data.groupSize} = ${data.total}.`;
    }
    if (data.operation === 'partitive-division') {
        return `${data.total} ÷ ${data.groupCount} = ${data.groupSize} objects in each row.`;
    }
    return `${data.total} ÷ ${data.groupSize} = ${data.groupCount} equal rows.`;
};

const interpretationPrompt = (data: NumberArrayProblem): string => {
    if (data.operation === 'addition') {
        return 'Explain how the equal rows represent repeated addition.';
    }
    if (data.operation === 'multiplication') {
        return `This set of ${data.total} objects is partitioned into ${data.groupCount} equal rows of ${data.groupSize}. What does ${data.groupCount} × ${data.groupSize} mean?`;
    }
    if (data.operation === 'partitive-division') {
        return `${data.total} objects are shared into ${data.groupCount} equal rows. How many are in each row?`;
    }
    return `${data.total} objects are arranged ${data.groupSize} per row. How many rows are made?`;
};

const formalizationPrompt = (data: NumberArrayProblem): string => {
    if (data.operation === 'addition') {
        return 'Write an addition equation with one equal addend for each row.';
    }
    if (data.operation === 'multiplication') return 'Write a multiplication equation for the array.';
    if (data.operation === 'partitive-division') {
        return 'Write a division equation that finds the number of objects in each row.';
    }
    return 'Write a division equation that finds the number of equal rows.';
};

const executionPrompt = (data: NumberArrayProblem): string => {
    if (data.operation === 'partitive-division') {
        return `Share ${data.total} objects among ${data.groupCount} equal rows. How many are in each row?`;
    }
    if (data.operation === 'quotative-division') {
        return `Arrange ${data.total} objects ${data.groupSize} per row. How many rows are made?`;
    }
    return 'Determine the total number of objects in the array.';
};

const executionLabel = (data: NumberArrayProblem): string =>
    data.operation === 'partitive-division'
        ? 'Objects in each row'
        : data.operation === 'quotative-division'
            ? 'Number of rows'
            : 'Total objects';

export const OperationsNumberArrayView = ({
    mode,
    payload,
    viewId
}: OperationsNumberArrayViewProps) => {
    const {problem, isSolutionView} = payload;
    const data = problem.data;
    validateProblemData(viewId, data, [
        'operation',
        'groupCount',
        'groupSize',
        'rows',
        'columns',
        'total',
        'answer',
        'addends'
    ]);

    if (!Number.isInteger(data.rows) || data.rows < 2 || data.rows > 5
        || !Number.isInteger(data.columns) || data.columns < 2 || data.columns > 5) {
        throw new ViewValidationError(
            viewId,
            'Rows and columns must each be integers from 2 through 5.'
        );
    }
    if (data.groupCount !== data.rows
        || data.groupSize !== data.columns
        || data.total !== data.rows * data.columns
        || data.addends.length !== data.rows
        || data.addends.some(addend => addend !== data.columns)) {
        throw new ViewValidationError(
            viewId,
            'Array dimensions, total, and repeated addends must agree.'
        );
    }

    const expectedAnswer = data.operation === 'partitive-division'
        ? data.groupSize
        : data.operation === 'quotative-division'
            ? data.groupCount
            : data.total;
    if (data.answer !== expectedAnswer) {
        throw new ViewValidationError(
            viewId,
            'The answer must agree with the requested equal-groups operation.'
        );
    }

    const prompt = mode === 'formalization'
        ? formalizationPrompt(data)
        : mode === 'interpretation'
            ? interpretationPrompt(data)
            : executionPrompt(data);

    return (
        <div className="w-[620px] rounded-2xl bg-white p-8 font-sans shadow-[0_10px_30px_rgba(15,23,42,0.08)]">
            <div className="text-center">
                <div className="text-sm font-bold uppercase tracking-[0.16em] text-indigo-700">Number array</div>
                <div className="mt-2 text-xl font-semibold text-slate-700">{prompt}</div>
            </div>

            <div className="mt-6 flex min-h-[250px] items-center justify-center rounded-xl border border-slate-200 bg-slate-50 p-6">
                <div
                    className="grid gap-3"
                    style={{gridTemplateColumns: `repeat(${data.columns}, minmax(0, 1fr))`}}
                    aria-label={`${data.rows} rows by ${data.columns} columns`}
                >
                    {Array.from({length: data.total}, (_, index) => (
                        <div key={index} className="flex size-12 items-center justify-center rounded-lg border-2 border-indigo-300 bg-white">
                            <div className="size-6 rounded-full bg-indigo-500" />
                        </div>
                    ))}
                </div>
            </div>

            <div className="mt-5 flex min-h-20 items-center justify-center rounded-xl border border-slate-200 px-5 py-4 font-mono text-2xl font-bold text-slate-700">
                {mode === 'interpretation' ? (
                    <span className="text-center font-sans text-xl">
                        {isSolutionView
                            ? interpretationFor(data)
                            : 'Use the rows and objects in each row to explain.'}
                    </span>
                ) : mode === 'formalization' ? (
                    isSolutionView ? (
                        <span className="text-center text-emerald-700">{equationFor(data)}</span>
                    ) : (
                        <span className="rounded-md border-2 border-dashed border-slate-400 px-8 py-3 text-lg text-slate-500">
                            Write the complete equation.
                        </span>
                    )
                ) : (
                    <>
                        <span className="mr-4 font-sans text-lg font-semibold text-slate-600">
                            {executionLabel(data)}
                        </span>
                        <span className="inline-flex min-w-20 justify-center rounded-md border-2 border-slate-700 px-3 py-1 text-emerald-700">
                            {isSolutionView ? data.answer : ''}
                        </span>
                    </>
                )}
            </div>
        </div>
    );
};
