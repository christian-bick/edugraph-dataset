import {createRoot} from 'react-dom/client';
import {ViewRenderPayload} from '../../../../types/ml-engine.ts';
import {validateProblemData, ViewValidationError} from '../../../helpers/validation.ts';
import {withConfig} from '../../withConfig.tsx';
import {PlaceValueArithmeticExplanationViewConfig, PlaceValueArithmeticExplanationViewSchema} from './spec.ts';
import '../../../../tailwind.css';

interface CoreProps {
    config: PlaceValueArithmeticExplanationViewConfig;
    payload: ViewRenderPayload<'place-value-arithmetic-explanation'>;
}

const PlaceValueArithmeticExplanationCore = ({config: _config, payload}: CoreProps) => {
    const {problem, isSolutionView} = payload;
    const data = problem.data;
    validateProblemData('place-value-arithmetic-explanation', data, [
        'num1', 'num2', 'answer', 'operation', 'operands', 'equation', 'strategySteps'
    ]);
    if (data.strategySteps.length !== 3) {
        throw new ViewValidationError('place-value-arithmetic-explanation', 'Expected three inspectable place-value strategy steps.');
    }
    const symbol = data.operation === 'addition' ? '+' : '−';

    return (
        <div className="w-[720px] rounded-2xl bg-white p-8 font-sans shadow-[0_10px_30px_rgba(15,23,42,0.08)]">
            <div className="text-center">
                <div className="text-sm font-bold uppercase tracking-[0.16em] text-indigo-700">Explain your strategy</div>
                <div className="mt-2 text-xl font-semibold text-slate-700">Explain how place value helps solve the problem.</div>
            </div>
            <div className="mt-6 flex items-center justify-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-6 py-4 font-mono text-3xl font-bold text-slate-800">
                <span>{data.num1}</span><span>{symbol}</span><span>{data.num2}</span><span>=</span>
                <span className="inline-flex min-h-12 min-w-20 items-center justify-center rounded-lg border-2 border-slate-700 bg-white px-3 text-emerald-700">
                    {isSolutionView ? data.answer : ''}
                </span>
            </div>
            <div className="mt-5 grid grid-cols-3 gap-3 text-center text-sm font-semibold text-slate-600">
                <div className="rounded-lg bg-indigo-50 p-3">Hundreds: {data.operands[0].hundreds} and {data.operands[1].hundreds}</div>
                <div className="rounded-lg bg-sky-50 p-3">Tens: {data.operands[0].tens} and {data.operands[1].tens}</div>
                <div className="rounded-lg bg-amber-50 p-3">Ones: {data.operands[0].ones} and {data.operands[1].ones}</div>
            </div>
            <div className={`mt-5 min-h-44 rounded-xl border-2 p-5 ${isSolutionView ? 'border-emerald-500 bg-emerald-50' : 'border-dashed border-slate-400 bg-white'}`}>
                {isSolutionView ? (
                    <ol className="space-y-3 text-base font-medium text-slate-700">
                        {data.strategySteps.map((step, index) => <li key={index}><span className="mr-2 font-bold text-emerald-700">{index + 1}.</span>{step}</li>)}
                    </ol>
                ) : (
                    <div className="text-slate-500">Describe what happens in the ones place, how you regroup, and how you reach the answer.</div>
                )}
            </div>
        </div>
    );
};

export const PlaceValueArithmeticExplanation = withConfig(PlaceValueArithmeticExplanationViewSchema, PlaceValueArithmeticExplanationCore);

let root: ReturnType<typeof createRoot> | null = null;
window.renderView = (payload: ViewRenderPayload<'place-value-arithmetic-explanation'>) => {
    const container = document.getElementById('view');
    if (container) {
        if (!root) root = createRoot(container);
        root.render(<PlaceValueArithmeticExplanation payload={payload} />);
    }
};
