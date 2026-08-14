import {Ability} from 'edugraph-ts';
import {createRoot} from 'react-dom/client';
import {ViewRenderPayload} from '../../../../types/ml-engine.ts';
import {validateProblemData, ViewValidationError} from '../../../helpers/validation.ts';
import {withConfig} from '../../withConfig.tsx';
import {OperationsNumberArrayViewConfig, OperationsNumberArrayViewSchema} from './spec.ts';
import '../../../../tailwind.css';

interface CoreProps {
    config: OperationsNumberArrayViewConfig;
    payload: ViewRenderPayload<'operations-number-array'>;
}

const OperationsNumberArrayCore = ({config, payload}: CoreProps) => {
    const {problem, isSolutionView} = payload;
    const data = problem.data;
    validateProblemData('operations-number-array', data, [
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
        throw new ViewValidationError('operations-number-array', 'Rows and columns must each be integers from 2 through 5.');
    }
    if (data.groupCount !== data.rows
        || data.groupSize !== data.columns
        || data.total !== data.rows * data.columns
        || data.addends.length !== data.rows
        || data.addends.some(addend => addend !== data.columns)) {
        throw new ViewValidationError('operations-number-array', 'Array dimensions, total, and repeated addends must agree.');
    }

    const expectedAnswer = data.operation === 'partitive-division'
        ? data.groupSize
        : data.operation === 'quotative-division'
            ? data.groupCount
            : data.total;
    if (data.answer !== expectedAnswer) {
        throw new ViewValidationError('operations-number-array', 'The answer must agree with the requested equal-groups operation.');
    }

    const isInterpretation = config.responseMode === Ability.Interpretation;
    const prompt = data.operation === 'multiplication'
        ? `This set of ${data.total} objects is partitioned into ${data.groupCount} equal rows of ${data.groupSize}. What does ${data.groupCount} × ${data.groupSize} mean?`
        : data.operation === 'partitive-division'
            ? `${data.total} objects are shared into ${data.groupCount} equal rows. How many are in each row?`
            : data.operation === 'quotative-division'
                ? `${data.total} objects are arranged ${data.groupSize} per row. How many rows are made?`
                : 'Add the equal rows. How many objects are in the array?';

    const interpretation = data.operation === 'multiplication'
        ? `The whole set is partitioned into ${data.groupCount} equal rows of ${data.groupSize}, so ${data.groupCount} × ${data.groupSize} = ${data.total}.`
        : data.operation === 'partitive-division'
            ? `${data.total} ÷ ${data.groupCount} = ${data.groupSize} objects in each row`
            : `${data.total} ÷ ${data.groupSize} = ${data.groupCount} equal rows`;

    return (
        <div className="w-[620px] rounded-2xl bg-white p-8 font-sans shadow-[0_10px_30px_rgba(15,23,42,0.08)]">
            <div className="text-center">
                <div className="text-sm font-bold uppercase tracking-[0.16em] text-indigo-700">Number array</div>
                <div className="mt-2 text-xl font-semibold text-slate-700">
                    {prompt}
                </div>
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

            <div className="mt-5 flex min-h-16 items-center justify-center rounded-xl border border-slate-200 px-5 py-4 font-mono text-2xl font-bold text-slate-700">
                {isInterpretation ? (
                    <span className="text-center font-sans text-xl">
                        {isSolutionView ? interpretation : 'Use the rows and objects in each row to explain.'}
                    </span>
                ) : data.operation === 'addition' ? (
                    <>
                        <span>{data.addends.join(' + ')}</span>
                        <span className="mx-3">=</span>
                        <span className="inline-flex min-w-16 justify-center rounded-md border-2 border-slate-700 px-3 py-1 text-emerald-700">
                            {isSolutionView ? data.total : ''}
                        </span>
                    </>
                ) : (
                    <>
                        <span className="mr-4 font-sans text-lg font-semibold text-slate-600">Total objects</span>
                        <span className="inline-flex min-w-20 justify-center rounded-md border-2 border-slate-700 px-3 py-1 text-emerald-700">
                            {isSolutionView ? data.total : ''}
                        </span>
                    </>
                )}
            </div>
        </div>
    );
};

export const OperationsNumberArray = withConfig(OperationsNumberArrayViewSchema, OperationsNumberArrayCore);

let root: ReturnType<typeof createRoot> | null = null;

window.renderView = (payload: ViewRenderPayload<'operations-number-array'>) => {
    const container = document.getElementById('view');
    if (container) {
        if (!root) root = createRoot(container);
        root.render(<OperationsNumberArray payload={payload} />);
    }
};
