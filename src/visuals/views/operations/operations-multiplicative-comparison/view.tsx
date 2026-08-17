import {createRoot} from 'react-dom/client';
import {ViewRenderPayload} from '../../../../types/ml-engine.ts';
import {validateProblemData, ViewValidationError} from '../../../helpers/validation.ts';
import {withConfig} from '../../withConfig.tsx';
import {
    OperationsMultiplicativeComparisonViewConfig,
    OperationsMultiplicativeComparisonViewSchema
} from './spec.ts';
import '../../../../tailwind.css';

interface CoreProps {
    config: OperationsMultiplicativeComparisonViewConfig;
    payload: ViewRenderPayload<'operations-multiplicative-comparison'>;
}

const VIEW_ID = 'operations-multiplicative-comparison';
const MODEL_WIDTH = 560;

const OperationsMultiplicativeComparisonCore = ({config: _config, payload}: CoreProps) => {
    const {problem, isSolutionView} = payload;
    const data = problem.data;
    validateProblemData(VIEW_ID, data, [
        'referenceQuantity',
        'scaleFactor',
        'comparedQuantity',
        'operation',
        'unknownRole',
        'referenceEntity',
        'comparedEntity',
        'solutionEquation',
        'comparisonStatement'
    ]);

    const quantities = [data.referenceQuantity, data.scaleFactor, data.comparedQuantity];
    if (!quantities.every(value => Number.isInteger(value) && value > 0)
        || data.scaleFactor < 2
        || data.scaleFactor > 10
        || data.referenceQuantity > 100
        || data.comparedQuantity > 1000) {
        throw new ViewValidationError(
            VIEW_ID,
            'This layout requires positive whole-number quantities, a scale factor from 2 through 10, a reference quantity at most 100, and a compared quantity at most 1000.'
        );
    }
    if (data.operation !== 'multiplication'
        || data.unknownRole !== 'compared'
        || data.referenceQuantity * data.scaleFactor !== data.comparedQuantity) {
        throw new ViewValidationError(
            VIEW_ID,
            'The payload must describe a mathematically consistent multiplication comparison.'
        );
    }
    if ([data.referenceEntity, data.comparedEntity, data.solutionEquation, data.comparisonStatement]
        .some(value => typeof value !== 'string' || value.trim().length === 0)
        || !/times as many/i.test(data.comparisonStatement)
        || !data.comparisonStatement.includes(String(data.scaleFactor))) {
        throw new ViewValidationError(
            VIEW_ID,
            'The comparison requires named entities, an equation, and a supplied “times as many” statement.'
        );
    }

    const referenceWidth = MODEL_WIDTH / data.scaleFactor;
    const questionStatement = data.comparisonStatement.replace(
        String(data.scaleFactor),
        '______'
    );

    return (
        <div className="w-[790px] rounded-2xl bg-white p-8 font-sans shadow-[0_10px_30px_rgba(15,23,42,0.08)]">
            <div className="text-center text-xl font-bold text-slate-800">
                Interpret the multiplication equation as a comparison.
            </div>

            <div className="mt-6 grid grid-cols-3 gap-4">
                <div className="rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-center">
                    <div className="text-xs font-bold uppercase tracking-wide text-sky-700">Reference quantity</div>
                    <div className="mt-1 text-2xl font-extrabold text-sky-950">{data.referenceQuantity}</div>
                    <div className="text-sm font-semibold text-sky-800">{data.referenceEntity}</div>
                </div>
                <div className="rounded-xl border border-violet-200 bg-violet-50 px-4 py-3 text-center">
                    <div className="text-xs font-bold uppercase tracking-wide text-violet-700">Scale factor</div>
                    <div className="mt-1 text-2xl font-extrabold text-violet-950">{data.scaleFactor}</div>
                    <div className="text-sm font-semibold text-violet-800">equal groups</div>
                </div>
                <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-center">
                    <div className="text-xs font-bold uppercase tracking-wide text-amber-700">Compared quantity</div>
                    <div className="mt-1 text-2xl font-extrabold text-amber-950">{data.comparedQuantity}</div>
                    <div className="text-sm font-semibold text-amber-800">{data.comparedEntity}</div>
                </div>
            </div>

            <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-5">
                <div className="grid grid-cols-[120px_1fr] items-center gap-x-4 gap-y-4">
                    <div className="text-right text-sm font-bold text-sky-800">{data.referenceEntity}</div>
                    <div className="flex items-center gap-3">
                        <div
                            className="flex h-12 items-center justify-center rounded-lg border-2 border-sky-500 bg-sky-100 font-mono text-lg font-bold text-sky-950"
                            style={{width: `${referenceWidth}px`}}
                        >
                            {data.referenceQuantity}
                        </div>
                        <div className="text-sm font-bold text-slate-600">reference</div>
                    </div>

                    <div className="text-right text-sm font-bold text-amber-800">{data.comparedEntity}</div>
                    <div>
                        <div
                            className="grid h-12 overflow-hidden rounded-lg border-2 border-amber-500 bg-amber-100"
                            style={{gridTemplateColumns: `repeat(${data.scaleFactor}, minmax(0, 1fr))`, width: `${MODEL_WIDTH}px`}}
                        >
                            {Array.from({length: data.scaleFactor}, (_, index) => (
                                <div
                                    className="flex items-center justify-center border-r border-amber-400 font-mono text-base font-bold text-amber-950 last:border-r-0"
                                    key={index}
                                >
                                    {data.referenceQuantity}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <div className="mt-5 rounded-xl border-2 border-indigo-200 bg-indigo-50 px-5 py-4 text-center">
                <div className="text-xs font-bold uppercase tracking-wide text-indigo-700">Multiplication equation</div>
                <div className="mt-1 font-mono text-[2rem] font-extrabold text-indigo-950">{data.solutionEquation}</div>
            </div>

            <div className="mt-5 min-h-[76px] rounded-xl border-2 border-emerald-300 bg-emerald-50 px-5 py-4 text-center">
                <div className="text-xs font-bold uppercase tracking-wide text-emerald-700">Comparison statement</div>
                {isSolutionView ? (
                    <div className="mt-1 text-xl font-bold text-emerald-950">{data.comparisonStatement}</div>
                ) : (
                    <div className="mt-1 text-xl font-bold text-emerald-950">{questionStatement}</div>
                )}
            </div>
        </div>
    );
};

export const OperationsMultiplicativeComparison = withConfig(
    OperationsMultiplicativeComparisonViewSchema,
    OperationsMultiplicativeComparisonCore
);

let root: ReturnType<typeof createRoot> | null = null;

window.renderView = (payload: ViewRenderPayload<'operations-multiplicative-comparison'>) => {
    const container = document.getElementById('view');
    if (container) {
        if (!root) root = createRoot(container);
        root.render(<OperationsMultiplicativeComparison payload={payload} />);
    }
};
