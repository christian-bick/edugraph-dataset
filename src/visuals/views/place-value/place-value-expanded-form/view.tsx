import {createRoot} from 'react-dom/client';
import {ViewRenderPayload} from '../../../../types/ml-engine.ts';
import {validateProblemData, ViewValidationError} from '../../../helpers/validation.ts';
import {withConfig} from '../../withConfig.tsx';
import {PlaceValueExpandedFormViewConfig, PlaceValueExpandedFormViewSchema} from './spec.ts';
import '../../../../tailwind.css';

interface CoreProps {
    config: PlaceValueExpandedFormViewConfig;
    payload: ViewRenderPayload<'place-value-expanded-form'>;
}

const PlaceValueExpandedFormCore = ({config: _config, payload}: CoreProps) => {
    const {problem, isSolutionView} = payload;
    const data = problem.data;
    validateProblemData('place-value-expanded-form', data, ['number', 'terms']);

    if (!Number.isInteger(data.number) || data.number < 100 || data.number > 999
        || ![2, 3].includes(data.terms.length)
        || data.terms.some(term => !Number.isInteger(term) || term <= 0)
        || data.terms.reduce((sum, term) => sum + term, 0) !== data.number) {
        throw new ViewValidationError('place-value-expanded-form', 'Expected a three-digit numeral decomposed into two or three non-zero place values.');
    }

    return (
        <div className="w-[700px] rounded-2xl bg-white p-8 font-sans shadow-[0_10px_30px_rgba(15,23,42,0.08)]">
            <div className="text-center">
                <div className="text-sm font-bold uppercase tracking-[0.16em] text-indigo-700">Expanded form</div>
                <div className="mt-2 text-xl font-semibold text-slate-700">Write the numeral as a sum of its place values.</div>
            </div>
            <div className="mt-6 flex justify-center">
                <div className="rounded-2xl border-2 border-indigo-300 bg-indigo-50 px-10 py-5 font-mono text-6xl font-extrabold text-slate-800">
                    {data.number}
                </div>
            </div>
            <div className="mt-6 flex items-center justify-center gap-3 rounded-xl border border-slate-200 px-6 py-5">
                {data.terms.map((term, index) => (
                    <div key={index} className="contents">
                        {index > 0 && <span className="text-3xl font-bold text-slate-500">+</span>}
                        <span className={`inline-flex min-h-14 min-w-24 items-center justify-center rounded-lg border-2 px-4 font-mono text-2xl font-bold ${
                            isSolutionView
                                ? 'border-emerald-600 bg-emerald-50 text-emerald-700'
                                : 'border-dashed border-slate-400 bg-white text-slate-700'
                        }`}>
                            {isSolutionView ? term : ''}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
};

export const PlaceValueExpandedForm = withConfig(PlaceValueExpandedFormViewSchema, PlaceValueExpandedFormCore);

let root: ReturnType<typeof createRoot> | null = null;

window.renderView = (payload: ViewRenderPayload<'place-value-expanded-form'>) => {
    const container = document.getElementById('view');
    if (container) {
        if (!root) root = createRoot(container);
        root.render(<PlaceValueExpandedForm payload={payload} />);
    }
};
