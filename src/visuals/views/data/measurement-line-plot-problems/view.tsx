import {createRoot} from 'react-dom/client';
import type {ViewRenderPayload} from '../../../../types/ml-engine.ts';
import type {MeasurementLinePlotFractionProblem} from '../../../../types/problems.ts';
import {validateProblemData, ViewValidationError} from '../../../helpers/validation.ts';
import {withConfig} from '../../withConfig.tsx';
import {
    buildFractionLinePlotPresentation,
    fractionStep,
    isValidMeasurementLinePlotFractionProblem,
    plotTicks
} from './helpers.ts';
import {
    MeasurementLinePlotProblemsViewConfig,
    MeasurementLinePlotProblemsViewSchema
} from './spec.ts';
import '../../../../tailwind.css';

const VIEW_ID = 'measurement-line-plot-problems';

interface CoreProps {
    config: MeasurementLinePlotProblemsViewConfig;
    payload: ViewRenderPayload<typeof VIEW_ID>;
}

const CompletedBeakerLinePlot = ({data}: {data: MeasurementLinePlotFractionProblem}) => {
    const ticks = plotTicks(data);
    return (
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-5 pb-4 pt-5" aria-label="Completed line plot with five beaker marks">
            <div className="grid items-end" style={{gridTemplateColumns: `repeat(${ticks.length}, minmax(0, 1fr))`}}>
                {ticks.map(tick => (
                    <div key={tick.numerator} className="flex h-[120px] min-w-0 flex-col items-center justify-end">
                        <div className="flex min-h-[80px] flex-col-reverse items-center text-[1.45rem] font-black leading-[1.35rem] text-violet-600" aria-label={`${tick.count} beakers at ${tick.label} cups`}>
                            {Array.from({length: tick.count}, (_, index) => <span key={index} aria-hidden="true">×</span>)}
                        </div>
                        <div className="mt-1 h-3 w-px bg-slate-600" />
                    </div>
                ))}
            </div>
            <div className="h-[2px] bg-slate-700" />
            <div className="grid" style={{gridTemplateColumns: `repeat(${ticks.length}, minmax(0, 1fr))`}}>
                {ticks.map(tick => (
                    <div key={tick.numerator} className="min-w-0 pt-2 text-center font-mono text-sm font-bold text-slate-700">
                        {tick.label}
                    </div>
                ))}
            </div>
            <div className="mt-3 text-center text-xs font-bold text-slate-600">
                Each X represents one beaker. Each tick interval is {fractionStep(data.denominator)} cup.
            </div>
            <div className="mt-1 text-center text-[0.68rem] font-bold uppercase tracking-wider text-slate-500">
                Liquid in each beaker (cups)
            </div>
        </div>
    );
};

export const MeasurementLinePlotProblemsCore = ({payload}: CoreProps) => {
    const {problem, isSolutionView} = payload;
    const data = problem.data;
    validateProblemData(VIEW_ID, data, ['kind', 'unit', 'denominator', 'observationNumerators', 'relation']);
    if (!isValidMeasurementLinePlotFractionProblem(data)) {
        throw new ViewValidationError(VIEW_ID, 'Expected five exact fractional beaker measurements and a matching relation.');
    }
    const presentation = buildFractionLinePlotPresentation(data);

    return (
        <div className="w-[900px] rounded-2xl bg-white p-7 font-sans shadow-[0_10px_30px_rgba(15,23,42,0.08)]">
            <div className="text-sm font-bold uppercase tracking-[0.16em] text-violet-700">
                Liquid measurements
            </div>
            <div className="mt-3 rounded-xl border-l-4 border-violet-500 bg-violet-50 px-5 py-4 text-xl font-semibold leading-relaxed text-slate-900">
                {presentation.story}
            </div>
            <div className="mt-4"><CompletedBeakerLinePlot data={data} /></div>
            <div className="mt-4 rounded-xl border-2 border-slate-200 bg-white px-5 py-4">
                <div className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
                    Calculation
                </div>
                {isSolutionView ? (
                    <div className="mt-3 space-y-2 font-mono text-[1.05rem] font-extrabold leading-relaxed text-slate-900">
                        {presentation.equations.map((equation, index) => (
                            <div key={index} className="break-words">{equation}</div>
                        ))}
                    </div>
                ) : (
                    <div className="mt-3 h-11 rounded-lg border-2 border-dashed border-slate-300" aria-label="Blank calculation" />
                )}
            </div>
            {isSolutionView ? (
                <div className="mt-4 rounded-xl border-2 border-emerald-500 bg-emerald-50 px-5 py-4 text-center">
                    <div className="text-xs font-bold uppercase tracking-[0.14em] text-emerald-700">Answer</div>
                    <div className="mt-1 text-[1.5rem] font-extrabold text-emerald-950">{presentation.answer}</div>
                </div>
            ) : (
                <div className="mt-4 rounded-xl border-2 border-dashed border-slate-300 px-5 py-4 text-center text-[1.45rem] font-extrabold text-slate-400">
                    Answer: ?
                </div>
            )}
        </div>
    );
};

export const MeasurementLinePlotProblemsView = withConfig(
    MeasurementLinePlotProblemsViewSchema,
    MeasurementLinePlotProblemsCore
);

let root: ReturnType<typeof createRoot> | null = null;

window.renderView = (payload: ViewRenderPayload<typeof VIEW_ID>) => {
    const container = document.getElementById('view');
    if (!container) return;
    if (!root) root = createRoot(container);
    root.render(<MeasurementLinePlotProblemsView payload={payload} />);
};
