import {PlaceValueHundredsBundlesProblem} from '../../../types/problems.ts';
import {validateProblemData} from '../../helpers/validation.ts';
import {explainHundredsBundles, validateHundredsBundles} from './hundreds-bundles-helpers.ts';

interface HundredsBundlesProps {
    viewId: string;
    data: PlaceValueHundredsBundlesProblem;
    isSolutionView: boolean;
    task: 'completion' | 'explanation';
}

function TenRod() {
    return (
        <div aria-label="ten rod" className="grid h-28 w-5 grid-rows-10 overflow-hidden rounded border border-sky-600 bg-sky-100">
            {Array.from({length: 10}, (_, index) => <div key={index} className="border-b border-sky-300 last:border-b-0" />)}
        </div>
    );
}

function HundredFlat() {
    return (
        <div aria-label="hundred flat" className="grid size-24 grid-cols-10 grid-rows-10 overflow-hidden rounded-md border-2 border-indigo-600 bg-indigo-50 shadow-sm">
            {Array.from({length: 100}, (_, index) => <div key={index} className="border-b border-r border-indigo-200" />)}
        </div>
    );
}

export function HundredsBundlesRenderer({viewId, data, isSolutionView, task}: HundredsBundlesProps) {
    validateProblemData(viewId, data, ['hundreds', 'tens', 'ones', 'target']);
    validateHundredsBundles(viewId, data);
    const tenTensTransformation = data.tens === 10;
    const question = task === 'explanation'
        ? (tenTensTransformation
            ? 'Explain how to regroup these tens as a hundred and why the total stays the same.'
            : 'Explain how to find the total from these hundreds and why your counting method works.')
        : (tenTensTransformation
            ? 'How many ones do these tens represent?'
            : 'How many ones do these hundreds represent?');

    return (
        <div className="w-[680px] rounded-2xl bg-white p-8 font-sans shadow-[0_10px_30px_rgba(15,23,42,0.08)]">
            <div className="text-center">
                <div className="text-sm font-bold uppercase tracking-[0.16em] text-indigo-700">Place value</div>
                <div className="mt-2 min-h-14 text-xl font-semibold text-slate-700">
                    {!isSolutionView && question}
                </div>
            </div>

            <div className="mt-6 flex min-h-[310px] items-center justify-center rounded-xl border border-slate-200 bg-slate-50 p-6">
                {tenTensTransformation ? (
                    <div className="flex items-center gap-8">
                        <div className="grid grid-cols-5 gap-3 rounded-xl border-2 border-dashed border-sky-300 bg-white p-4">
                            {Array.from({length: data.tens}, (_, index) => <TenRod key={index} />)}
                        </div>
                        <span className="text-4xl font-bold text-slate-400">→</span>
                        <div className="flex flex-col items-center gap-3">
                            <HundredFlat />
                            <span className="font-semibold text-indigo-800">1 hundred</span>
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-3 gap-4">
                        {Array.from({length: data.hundreds}, (_, index) => <HundredFlat key={index} />)}
                    </div>
                )}
            </div>

            <div className="mt-5 flex items-center justify-center gap-3 rounded-xl border border-slate-200 px-5 py-4 text-xl font-bold text-slate-700">
                <span>{tenTensTransformation ? `${data.tens} tens` : `${data.hundreds} ${data.hundreds === 1 ? 'hundred' : 'hundreds'}`}</span>
                <span className="text-slate-400">=</span>
                <span aria-label="represented number" className="inline-flex min-h-12 min-w-24 items-center justify-center rounded-lg border-2 border-slate-700 bg-white px-3 font-mono text-emerald-700">
                    {isSolutionView ? data.target : ''}
                </span>
                <span>ones</span>
            </div>

            {task === 'explanation' && (
                <div aria-label="explanation" className={`mt-5 min-h-[192px] rounded-xl border px-5 py-4 text-base leading-6 ${
                    isSolutionView ? 'border-emerald-300 bg-emerald-50 text-emerald-900' : 'border-slate-300 bg-white'
                }`}>
                    {isSolutionView ? (
                        <div className="space-y-3">
                            {explainHundredsBundles(data).map(step => <p key={step}>{step}</p>)}
                        </div>
                    ) : (
                        <div aria-hidden="true" className="space-y-8 pt-6">
                            <div className="border-b border-slate-300" />
                            <div className="border-b border-slate-300" />
                            <div className="border-b border-slate-300" />
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
