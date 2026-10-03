import {createRoot} from 'react-dom/client';
import type {ViewRenderPayload} from '../../../../types/ml-engine.ts';
import {formatUnitEquivalence} from '../../../helpers/measurement-conversion.ts';
import {validateProblemData, ViewValidationError} from '../../../helpers/validation.ts';
import {withConfig} from '../../withConfig.tsx';
import {
    buildMeasurementConversionStoryPresentation,
    isValidMeasurementConversionStory
} from './helpers.ts';
import {
    MeasureConversionProblemsViewConfig,
    MeasureConversionProblemsViewSchema
} from './spec.ts';
import '../../../../tailwind.css';

const VIEW_ID = 'measure-conversion-problems';

interface CoreProps {
    config: MeasureConversionProblemsViewConfig;
    payload: ViewRenderPayload<typeof VIEW_ID>;
}

export const MeasureConversionProblemsCore = ({payload}: CoreProps) => {
    const {problem, isSolutionView} = payload;
    const data = problem.data;
    validateProblemData(VIEW_ID, data, [
        'kind', 'pair', 'numberKind', 'sourceSide', 'conversion',
        'additionalTargetHundredths', 'totalTargetHundredths'
    ]);
    if (!isValidMeasurementConversionStory(data)) {
        throw new ViewValidationError(VIEW_ID, 'Expected an exact two-step measurement conversion story.');
    }
    const presentation = buildMeasurementConversionStoryPresentation(data);

    return (
        <div className="w-[850px] rounded-2xl bg-white p-7 font-sans shadow-[0_10px_32px_rgba(15,23,42,0.09)]">
            <div className="text-sm font-bold uppercase tracking-[0.16em] text-indigo-700">
                Measurement story
            </div>
            <div className="mt-4 rounded-xl border-l-4 border-indigo-500 bg-slate-50 px-6 py-5 text-xl font-semibold leading-relaxed text-slate-800">
                <p>{presentation.story}</p>
                <p className="mt-3 font-extrabold text-slate-950">{presentation.question}</p>
            </div>
            <div className="mt-4 flex items-center justify-between rounded-xl border border-indigo-200 bg-indigo-50 px-5 py-3">
                <span className="text-xs font-bold uppercase tracking-[0.14em] text-indigo-700">Unit relation</span>
                <span className="text-lg font-bold text-indigo-950">{formatUnitEquivalence(data.pair)}</span>
            </div>
            <p className="mt-5 text-base font-semibold text-slate-700">
                Write a conversion equation, then add the two amounts in {presentation.targetUnitPlural}.
            </p>
            <div className="mt-4 grid grid-cols-2 gap-4">
                <div className="min-w-0 rounded-xl border-2 border-slate-200 bg-white px-5 py-4">
                    <div className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">1. Convert</div>
                    {isSolutionView ? (
                        <div className="mt-3 space-y-2 text-lg font-bold leading-snug text-slate-900">
                            <div className="break-words font-mono">{presentation.factorEquation}</div>
                            <div className="break-words text-base text-indigo-800">{presentation.convertedEquality}</div>
                        </div>
                    ) : (
                        <div className="mt-5 h-12 rounded-lg border-2 border-dashed border-slate-300" aria-label="Blank conversion equation" />
                    )}
                </div>
                <div className="min-w-0 rounded-xl border-2 border-slate-200 bg-white px-5 py-4">
                    <div className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">2. Add</div>
                    {isSolutionView ? (
                        <div className="mt-3 break-words font-mono text-lg font-bold leading-snug text-slate-900">
                            {presentation.additionEquation}
                        </div>
                    ) : (
                        <div className="mt-5 h-12 rounded-lg border-2 border-dashed border-slate-300" aria-label="Blank addition equation" />
                    )}
                </div>
            </div>
            {isSolutionView ? (
                <div className="mt-5 rounded-xl border-2 border-emerald-500 bg-emerald-50 px-5 py-4 text-center">
                    <div className="text-xs font-bold uppercase tracking-[0.14em] text-emerald-700">Answer</div>
                    <div className="mt-1 text-[1.7rem] font-extrabold text-emerald-950">{presentation.answer}</div>
                </div>
            ) : (
                <div className="mt-5 rounded-xl border-2 border-dashed border-slate-300 px-5 py-4 text-center text-[1.5rem] font-extrabold text-slate-400">
                    Total: ?
                </div>
            )}
        </div>
    );
};

export const MeasureConversionProblemsView = withConfig(
    MeasureConversionProblemsViewSchema,
    MeasureConversionProblemsCore
);

let root: ReturnType<typeof createRoot> | null = null;

window.renderView = (payload: ViewRenderPayload<typeof VIEW_ID>) => {
    const container = document.getElementById('view');
    if (!container) return;
    if (!root) root = createRoot(container);
    root.render(<MeasureConversionProblemsView payload={payload} />);
};
