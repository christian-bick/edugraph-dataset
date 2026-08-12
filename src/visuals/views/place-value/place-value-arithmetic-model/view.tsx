import {createRoot} from 'react-dom/client';
import {ViewRenderPayload} from '../../../../types/ml-engine.ts';
import {PlaceValueDigits} from '../../../../types/problems.ts';
import {validateProblemData, ViewValidationError} from '../../../helpers/validation.ts';
import {withConfig} from '../../withConfig.tsx';
import {PlaceValueArithmeticModelViewConfig, PlaceValueArithmeticModelViewSchema} from './spec.ts';
import '../../../../tailwind.css';

interface CoreProps {
    config: PlaceValueArithmeticModelViewConfig;
    payload: ViewRenderPayload<'place-value-arithmetic-model'>;
}

function PlaceBlocks({digits, label}: {digits: PlaceValueDigits; label: string}) {
    return (
        <div className="min-w-0 rounded-xl border border-slate-200 bg-white p-4">
            <div className="mb-3 text-center text-sm font-bold text-slate-600">{label}</div>
            <div className="grid min-h-24 grid-cols-3 items-end gap-2">
                <div className="grid grid-cols-3 place-content-center gap-1" aria-label={`${digits.hundreds} hundreds`}>
                    {Array.from({length: digits.hundreds}, (_, index) => <span key={index} className="size-6 border-2 border-indigo-500 bg-indigo-100" />)}
                </div>
                <div className="grid grid-cols-5 place-content-center items-end gap-1" aria-label={`${digits.tens} tens`}>
                    {Array.from({length: digits.tens}, (_, index) => <span key={index} className="h-9 w-2 border-2 border-sky-500 bg-sky-100" />)}
                </div>
                <div className="grid grid-cols-5 place-content-center gap-1" aria-label={`${digits.ones} ones`}>
                    {Array.from({length: digits.ones}, (_, index) => <span key={index} className="size-3 rounded-sm border border-amber-600 bg-amber-200" />)}
                </div>
            </div>
            <div className="mt-3 grid grid-cols-3 text-center text-xs font-semibold text-slate-500">
                <span>hundreds</span><span>tens</span><span>ones</span>
            </div>
        </div>
    );
}

const PlaceValueArithmeticModelCore = ({config, payload}: CoreProps) => {
    const {problem, isSolutionView} = payload;
    const data = problem.data;
    validateProblemData('place-value-arithmetic-model', data, [
        'num1', 'num2', 'answer', 'operation', 'operands', 'result', 'regrouping', 'equation'
    ]);
    if (data.operands.length !== 2 || !['addition', 'subtraction'].includes(data.operation)) {
        throw new ViewValidationError('place-value-arithmetic-model', 'Expected two place-value operands for addition or subtraction.');
    }
    const symbol = data.operation === 'addition' ? '+' : '−';

    return (
        <div className="w-[760px] rounded-2xl bg-white p-7 font-sans shadow-[0_10px_30px_rgba(15,23,42,0.08)]">
            <div className="text-center">
                <div className="text-sm font-bold uppercase tracking-[0.16em] text-indigo-700">Regroup by place value</div>
                <div className="mt-2 text-xl font-semibold text-slate-700">Use the blocks to regroup and solve.</div>
            </div>
            <div className="mt-5 grid grid-cols-[1fr_auto_1fr] items-center gap-4 rounded-xl bg-slate-50 p-4">
                <PlaceBlocks digits={data.operands[0]} label={String(data.num1)} />
                <span className="text-4xl font-bold text-slate-500">{symbol}</span>
                <PlaceBlocks digits={data.operands[1]} label={String(data.num2)} />
            </div>
            <div className="mt-4 rounded-xl border border-amber-300 bg-amber-50 px-5 py-3 text-center font-semibold text-amber-900">
                {isSolutionView ? data.regrouping : 'What must be regrouped in the ones place?'}
            </div>
            {config.showWrittenMethod && (
                <div className="mt-4 flex items-center justify-center gap-3 font-mono text-2xl font-bold text-slate-700">
                    <span>{data.num1}</span><span>{symbol}</span><span>{data.num2}</span><span>=</span>
                    <span className="inline-flex min-h-12 min-w-20 items-center justify-center rounded-lg border-2 border-slate-700 px-3 text-emerald-700">
                        {isSolutionView ? data.answer : ''}
                    </span>
                </div>
            )}
            {!config.showWrittenMethod && (
                <div className="mt-4 flex items-center justify-center gap-3 text-lg font-semibold text-slate-600">
                    <span>Result</span>
                    <span className="inline-flex min-h-12 min-w-20 items-center justify-center rounded-lg border-2 border-slate-700 px-3 font-mono text-2xl text-emerald-700">
                        {isSolutionView ? data.answer : ''}
                    </span>
                </div>
            )}
        </div>
    );
};

export const PlaceValueArithmeticModel = withConfig(PlaceValueArithmeticModelViewSchema, PlaceValueArithmeticModelCore);

let root: ReturnType<typeof createRoot> | null = null;
window.renderView = (payload: ViewRenderPayload<'place-value-arithmetic-model'>) => {
    const container = document.getElementById('view');
    if (container) {
        if (!root) root = createRoot(container);
        root.render(<PlaceValueArithmeticModel payload={payload} />);
    }
};
