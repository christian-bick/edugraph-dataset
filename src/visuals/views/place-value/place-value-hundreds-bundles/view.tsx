import {createRoot} from 'react-dom/client';
import {ViewRenderPayload} from '../../../../types/ml-engine.ts';
import {validateProblemData, ViewValidationError} from '../../../helpers/validation.ts';
import {withConfig} from '../../withConfig.tsx';
import {PlaceValueHundredsBundlesViewConfig, PlaceValueHundredsBundlesViewSchema} from './spec.ts';
import '../../../../tailwind.css';

interface CoreProps {
    config: PlaceValueHundredsBundlesViewConfig;
    payload: ViewRenderPayload<'place-value-hundreds-bundles'>;
}

function TenRod() {
    return (
        <div className="grid h-28 w-5 grid-rows-10 overflow-hidden rounded border border-sky-600 bg-sky-100">
            {Array.from({length: 10}, (_, index) => <div key={index} className="border-b border-sky-300 last:border-b-0" />)}
        </div>
    );
}

function HundredFlat() {
    return (
        <div className="grid size-24 grid-cols-10 grid-rows-10 overflow-hidden rounded-md border-2 border-indigo-600 bg-indigo-50 shadow-sm">
            {Array.from({length: 100}, (_, index) => <div key={index} className="border-b border-r border-indigo-200" />)}
        </div>
    );
}

const PlaceValueHundredsBundlesCore = ({config: _config, payload}: CoreProps) => {
    const {problem, isSolutionView} = payload;
    const data = problem.data;
    validateProblemData('place-value-hundreds-bundles', data, ['hundreds', 'tens', 'ones', 'target']);
    const hundreds = data.hundreds;

    if (hundreds === undefined || !Number.isInteger(hundreds) || hundreds < 1 || hundreds > 9
        || data.ones !== 0 || data.target !== hundreds * 100
        || (data.tens !== 0 && !(hundreds === 1 && data.tens === 10))) {
        throw new ViewValidationError('place-value-hundreds-bundles', 'Expected 1-9 complete hundreds or ten tens forming one hundred.');
    }

    const tenTensTransformation = hundreds === 1 && data.tens === 10;

    return (
        <div className="w-[680px] rounded-2xl bg-white p-8 font-sans shadow-[0_10px_30px_rgba(15,23,42,0.08)]">
            <div className="text-center">
                <div className="text-sm font-bold uppercase tracking-[0.16em] text-indigo-700">Place value</div>
                <div className="mt-2 text-xl font-semibold text-slate-700">
                    {tenTensTransformation ? 'How many tens make one hundred?' : 'How many are represented by these hundreds?'}
                </div>
            </div>

            <div className="mt-6 flex min-h-[310px] items-center justify-center rounded-xl border border-slate-200 bg-slate-50 p-6">
                {tenTensTransformation ? (
                    <div className="flex items-center gap-8">
                        <div className="grid grid-cols-5 gap-3 rounded-xl border-2 border-dashed border-sky-300 bg-white p-4">
                            {Array.from({length: 10}, (_, index) => <TenRod key={index} />)}
                        </div>
                        <span className="text-4xl font-bold text-slate-400">→</span>
                        <div className="flex flex-col items-center gap-3">
                            <HundredFlat />
                            <span className="font-semibold text-indigo-800">1 hundred</span>
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-3 gap-4">
                        {Array.from({length: hundreds}, (_, index) => <HundredFlat key={index} />)}
                    </div>
                )}
            </div>

            <div className="mt-5 flex items-center justify-center gap-3 rounded-xl border border-slate-200 px-5 py-4 text-xl font-bold text-slate-700">
                <span>{tenTensTransformation ? '10 tens' : `${hundreds} ${hundreds === 1 ? 'hundred' : 'hundreds'}`}</span>
                <span className="text-slate-400">=</span>
                <span className="inline-flex min-h-12 min-w-24 items-center justify-center rounded-lg border-2 border-slate-700 bg-white px-3 font-mono text-emerald-700">
                    {isSolutionView ? data.target : ''}
                </span>
            </div>
        </div>
    );
};

export const PlaceValueHundredsBundles = withConfig(PlaceValueHundredsBundlesViewSchema, PlaceValueHundredsBundlesCore);

let root: ReturnType<typeof createRoot> | null = null;

window.renderView = (payload: ViewRenderPayload<'place-value-hundreds-bundles'>) => {
    const container = document.getElementById('view');
    if (container) {
        if (!root) root = createRoot(container);
        root.render(<PlaceValueHundredsBundles payload={payload} />);
    }
};
