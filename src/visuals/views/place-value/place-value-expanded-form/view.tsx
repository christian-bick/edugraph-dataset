import {createRoot} from 'react-dom/client';
import {ViewRenderPayload} from '../../../../types/ml-engine.ts';
import {
    LegacyPlaceValueExpandedProblem,
    MultiDigitPlaceValueExpandedProblem,
    PlaceValueExpandedProblem
} from '../../../../types/problems.ts';
import {validateProblemData, ViewValidationError} from '../../../helpers/validation.ts';
import {withConfig} from '../../withConfig.tsx';
import {
    displayPlaceName,
    isValidLegacyExpandedProblem,
    isValidMultiDigitExpandedProblem
} from './helpers.ts';
import {PlaceValueExpandedFormViewConfig, PlaceValueExpandedFormViewSchema} from './spec.ts';
import '../../../../tailwind.css';

interface CoreProps {
    config: PlaceValueExpandedFormViewConfig;
    payload: ViewRenderPayload<'place-value-expanded-form'>;
}

const VIEW_ID = 'place-value-expanded-form';
const numberFormatter = new Intl.NumberFormat('en-US');

function isGrade4(data: PlaceValueExpandedProblem): data is MultiDigitPlaceValueExpandedProblem {
    return 'task' in data && data.task === 'multi-digit-expanded-form';
}

function LegacyExpandedForm({data, isSolutionView}: {
    data: LegacyPlaceValueExpandedProblem;
    isSolutionView: boolean;
}) {
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
                    <div className="contents" key={index}>
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
}

function PlaceStrip({data}: {data: MultiDigitPlaceValueExpandedProblem}) {
    return (
        <div className="mt-5 flex justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-4">
            {data.placeValues.map(place => (
                <div className="w-[108px] text-center" key={place.name}>
                    <div className="flex h-14 items-center justify-center rounded-lg border-2 border-indigo-200 bg-white font-mono text-2xl font-extrabold text-slate-900">{place.digit}</div>
                    <div className="mt-2 text-[11px] font-semibold leading-tight text-slate-500">{displayPlaceName(place.name)}</div>
                </div>
            ))}
        </div>
    );
}

function Grade4ExpandedForm({data, isSolutionView}: {
    data: MultiDigitPlaceValueExpandedProblem;
    isSolutionView: boolean;
}) {
    return (
        <div className="w-[780px] rounded-2xl bg-white p-7 font-sans shadow-[0_10px_30px_rgba(15,23,42,0.08)]">
            <div className="text-center text-sm font-bold uppercase tracking-[0.16em] text-indigo-700">Multi-digit expanded form</div>
            <div className="mt-2 text-center text-xl font-bold text-slate-800">{data.prompt}</div>
            <div className="mt-5 text-center font-mono text-5xl font-extrabold text-slate-900">{numberFormatter.format(data.number)}</div>
            <PlaceStrip data={data} />

            {isSolutionView ? (
                <div className="mt-5 rounded-xl border-2 border-emerald-500 bg-emerald-50 px-5 py-5 text-center font-mono text-xl font-extrabold text-emerald-950">{data.expandedEquation}</div>
            ) : (
                <div className="mt-5 flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-5">
                    <span className="mr-1 font-mono text-xl font-bold text-slate-700">{numberFormatter.format(data.number)} =</span>
                    {data.terms.map((term, index) => (
                        <div className="contents" key={`${index}-${term}`}>
                            {index > 0 && <span className="text-2xl font-bold text-slate-400">+</span>}
                            <span className="h-12 min-w-[88px] rounded-lg border-2 border-dashed border-slate-300 bg-slate-50" />
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

const PlaceValueExpandedFormCore = ({config: _config, payload}: CoreProps) => {
    const {problem, isSolutionView} = payload;
    const data = problem.data;
    validateProblemData(VIEW_ID, data, ['number', 'terms']);

    if (isGrade4(data)) {
        validateProblemData(VIEW_ID, data, ['task', 'placeValues', 'prompt', 'expandedEquation']);
        if (!isValidMultiDigitExpandedProblem(data)) {
            throw new ViewValidationError(VIEW_ID, 'Expected a complete multi-digit numeral and its supplied non-zero place-value terms.');
        }
        return <Grade4ExpandedForm data={data} isSolutionView={isSolutionView} />;
    }

    if (!isValidLegacyExpandedProblem(data)) {
        throw new ViewValidationError(VIEW_ID, 'Expected a three-digit numeral decomposed into two or three non-zero place values.');
    }
    return <LegacyExpandedForm data={data} isSolutionView={isSolutionView} />;
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
