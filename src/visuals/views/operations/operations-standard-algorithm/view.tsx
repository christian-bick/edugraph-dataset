import {createRoot} from 'react-dom/client';
import {ViewRenderPayload} from '../../../../types/ml-engine.ts';
import {StandardAlgorithmColumnStep} from '../../../../types/problems.ts';
import {validateProblemData, ViewValidationError} from '../../../helpers/validation.ts';
import {withConfig} from '../../withConfig.tsx';
import {isValidStandardAlgorithmProblem} from './helpers.ts';
import {
    OperationsStandardAlgorithmViewConfig,
    OperationsStandardAlgorithmViewSchema
} from './spec.ts';
import '../../../../tailwind.css';

interface CoreProps {
    config: OperationsStandardAlgorithmViewConfig;
    payload: ViewRenderPayload<'operations-standard-algorithm'>;
}

const BlankWork = ({label, compact = false}: {label: string; compact?: boolean}) => (
    <span
        aria-label={label}
        className={`inline-block rounded-md border-2 border-dashed border-slate-300 bg-white ${compact ? 'h-7 w-10' : 'h-10 w-14'}`}
    />
);

const PlaceValueTable = ({
    columns,
    operation,
    isSolutionView
}: {
    columns: readonly StandardAlgorithmColumnStep[];
    operation: 'addition' | 'subtraction';
    isSolutionView: boolean;
}) => {
    const displayColumns = [...columns].reverse();
    const symbol = operation === 'addition' ? '+' : '−';
    const regroupLabel = operation === 'addition' ? 'Carry record' : 'Borrow record';
    const gridTemplateColumns = `142px repeat(${displayColumns.length}, minmax(0, 1fr))`;

    return (
        <div
            className="overflow-hidden rounded-xl border-2 border-indigo-300 bg-white"
            aria-label={`${displayColumns.length}-column standard ${operation} algorithm workspace`}
        >
            <div className="grid" style={{gridTemplateColumns}}>
                <div className="flex min-h-14 items-center border-b-2 border-r-2 border-indigo-300 bg-indigo-700 px-4 text-xs font-bold uppercase tracking-wide text-white">
                    Place
                </div>
                {displayColumns.map(column => (
                    <div key={`heading-${column.placeValue}`} className="flex min-h-14 items-center justify-center border-b-2 border-r border-indigo-300 bg-indigo-50 px-2 text-center text-xs font-bold uppercase tracking-wide text-indigo-800 last:border-r-0">
                        {column.placeName}
                    </div>
                ))}

                <div className="flex min-h-[74px] items-center border-b border-r-2 border-indigo-200 bg-amber-50 px-4 text-sm font-bold text-amber-900">
                    {regroupLabel}
                </div>
                {displayColumns.map(column => (
                    <div key={`regroup-${column.placeValue}`} className="flex min-h-[74px] items-center justify-center border-b border-r border-indigo-200 bg-amber-50 px-2 text-center last:border-r-0">
                        {isSolutionView ? (
                            <span className="text-xs font-semibold leading-snug text-amber-900">
                                {column.regroupingRecord}
                            </span>
                        ) : (
                            <BlankWork compact label={`Blank ${regroupLabel.toLowerCase()} for ${column.placeName}`} />
                        )}
                    </div>
                ))}

                <div className="flex min-h-14 items-center border-b border-r-2 border-indigo-200 bg-slate-50 px-4 text-sm font-bold text-slate-600">
                    Top number
                </div>
                {displayColumns.map(column => (
                    <div key={`top-${column.placeValue}`} className="flex min-h-14 items-center justify-center border-b border-r border-indigo-200 bg-slate-50 font-mono text-3xl font-bold text-slate-800 last:border-r-0">
                        {column.topDigit}
                    </div>
                ))}

                <div className="flex min-h-14 items-center border-b-2 border-r-2 border-indigo-400 bg-slate-50 px-4 text-sm font-bold text-slate-700">
                    <span className="mr-3 text-2xl text-indigo-700">{symbol}</span>
                    Bottom number
                </div>
                {displayColumns.map(column => (
                    <div key={`bottom-${column.placeValue}`} className="flex min-h-14 items-center justify-center border-b-2 border-r border-indigo-400 bg-slate-50 font-mono text-3xl font-bold text-slate-800 last:border-r-0">
                        {column.bottomDigit}
                    </div>
                ))}

                <div className={`flex min-h-[68px] items-center border-b border-r-2 px-4 text-sm font-bold ${isSolutionView ? 'bg-emerald-50 text-emerald-800' : 'bg-white text-slate-600'}`}>
                    Result
                </div>
                {displayColumns.map(column => (
                    <div key={`result-${column.placeValue}`} className={`flex min-h-[68px] items-center justify-center border-b border-r border-indigo-200 font-mono text-3xl font-bold last:border-r-0 ${isSolutionView ? 'bg-emerald-50 text-emerald-900' : 'bg-white'}`}>
                        {isSolutionView
                            ? column.resultDigit
                            : <BlankWork label={`Blank result digit for ${column.placeName}`} />}
                    </div>
                ))}

                <div className={`flex min-h-[94px] items-center border-r-2 border-indigo-200 px-4 text-sm font-bold ${isSolutionView ? 'bg-sky-50 text-sky-800' : 'bg-white text-slate-600'}`}>
                    Column calculation
                </div>
                {displayColumns.map(column => (
                    <div key={`calculation-${column.placeValue}`} className={`flex min-h-[94px] items-center justify-center border-r border-indigo-200 px-2 text-center last:border-r-0 ${isSolutionView ? 'bg-sky-50' : 'bg-white'}`}>
                        {isSolutionView ? (
                            <span className="text-xs font-semibold leading-snug text-sky-950">
                                {column.calculation}
                            </span>
                        ) : (
                            <BlankWork label={`Blank calculation for ${column.placeName}`} />
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

const OperationsStandardAlgorithmCore = ({config: _config, payload}: CoreProps) => {
    const {problem, isSolutionView} = payload;
    const data = problem.data;
    validateProblemData('operations-standard-algorithm', data, [
        'task',
        'operation',
        'topValue',
        'bottomValue',
        'result',
        'columns',
        'prompt',
        'questionEquation',
        'solutionEquation',
        'explanation'
    ]);
    if (!isValidStandardAlgorithmProblem(data)) {
        throw new ViewValidationError(
            'operations-standard-algorithm',
            'The values, ordered place-value columns, regrouping records, calculations, and equations must agree.'
        );
    }

    const operationLabel = data.operation === 'addition' ? 'addition' : 'subtraction';
    return (
        <div className="w-[980px] rounded-2xl bg-white p-7 font-sans shadow-[0_10px_32px_rgba(15,23,42,0.08)]">
            <div className="text-center">
                <div className="text-sm font-bold uppercase tracking-[0.16em] text-indigo-700">
                    Standard {operationLabel} algorithm
                </div>
                <div className="mt-1 text-xl font-bold text-slate-800">{data.prompt}</div>
                <div className={`mx-auto mt-3 w-fit rounded-lg border-2 px-6 py-2 font-mono text-2xl font-bold ${isSolutionView ? 'border-emerald-400 bg-emerald-50 text-emerald-900' : 'border-dashed border-slate-300 text-slate-700'}`}>
                    {isSolutionView ? data.solutionEquation : data.questionEquation}
                </div>
            </div>

            <div className="mt-5">
                <PlaceValueTable
                    columns={data.columns}
                    operation={data.operation}
                    isSolutionView={isSolutionView}
                />
            </div>

            {isSolutionView ? (
                <div className="mt-4 rounded-xl border-2 border-emerald-400 bg-emerald-50 px-5 py-3 text-center text-sm font-semibold leading-relaxed text-emerald-950">
                    {data.explanation}
                </div>
            ) : (
                <div className="mt-4 rounded-xl border-2 border-dashed border-slate-300 px-5 py-3 text-center text-sm font-semibold text-slate-600">
                    Work from the ones place to the left. Record each {data.operation === 'addition' ? 'carry' : 'borrow'}, calculation, and result digit.
                </div>
            )}
        </div>
    );
};

export const OperationsStandardAlgorithm = withConfig(
    OperationsStandardAlgorithmViewSchema,
    OperationsStandardAlgorithmCore
);

let root: ReturnType<typeof createRoot> | null = null;

window.renderView = (payload: ViewRenderPayload<'operations-standard-algorithm'>) => {
    const container = document.getElementById('view');
    if (container) {
        if (!root) root = createRoot(container);
        root.render(<OperationsStandardAlgorithm payload={payload} />);
    }
};
