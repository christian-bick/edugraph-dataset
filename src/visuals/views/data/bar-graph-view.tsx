import {AbstractProblem, RenderPayload} from '../../../types/ml-engine.ts';
import {StatisticalGraphProblem} from '../../../types/problems.ts';
import {ViewValidationError} from '../../helpers/validation.ts';
import {categoryStyles, validateStatisticalGraph} from './helpers.ts';
import {
    revealsBarCounts,
    revealsBars,
    resolveStatisticalGraphTask,
    StatisticalGraphViewMode,
    taskHeading
} from './statistical-graph-presentation.ts';

interface BarGraphViewProps {
    mode: StatisticalGraphViewMode;
    payload: RenderPayload<AbstractProblem<StatisticalGraphProblem>>;
    viewId: string;
}

const observationStyle = {
    Apples: categoryStyles[0],
    Books: categoryStyles[1],
    Kites: categoryStyles[2]
} as const;

const AnswerBox = ({answer}: {answer?: number}) => (
    <span className="inline-flex min-h-11 min-w-16 items-center justify-center rounded-md border-2 border-slate-500 bg-white px-3 py-1 text-emerald-700">
        {answer}
    </span>
);

export const BarGraphView = ({mode, payload, viewId}: BarGraphViewProps) => {
    const {problem, isSolutionView} = payload;
    const data = problem.data;
    validateStatisticalGraph(data, viewId);

    const displayTask = resolveStatisticalGraphTask(data, mode);
    if (displayTask === null) {
        throw new ViewValidationError(
            viewId,
            `The ${mode} bar-graph view does not support the generated statistical task.`
        );
    }

    const revealBars = revealsBars(data, isSolutionView, displayTask);
    const revealCounts = revealsBarCounts(data, isSolutionView, displayTask);
    const axisValues = Array.from({length: 9}, (_, value) => (8 - value) * data.scale);

    return (
        <div className="w-[700px] rounded-2xl bg-white p-8 font-sans shadow-[0_10px_30px_rgba(15,23,42,0.08)]">
            <div className="text-sm font-bold uppercase tracking-[0.16em] text-sky-700">Bar graph</div>
            <div className="mt-1 text-xl font-bold text-slate-800">{taskHeading(data, isSolutionView, displayTask)}</div>

            {displayTask === 'construct' && (
                <div className="mt-4 flex justify-center gap-3">
                    {data.categories.map(({label, count}, index) => (
                        <div key={label} className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-bold text-slate-700">
                            <span className={categoryStyles[index].text}>{label}</span>: {count}
                        </div>
                    ))}
                </div>
            )}

            {data.task === 'organize' && (
                <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <div className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">Unsorted observations</div>
                    <div className="flex flex-wrap justify-center gap-2">
                        {data.rawObservations.map((label, index) => (
                            <span
                                key={`${label}-${index}`}
                                className={`rounded-full bg-white px-3 py-1 text-sm font-bold shadow-sm ${observationStyle[label].text}`}
                            >
                                {label}
                            </span>
                        ))}
                    </div>
                </div>
            )}

            <div className="mt-5 grid grid-cols-[30px_1fr] gap-3">
                <div className="relative h-[280px] text-right font-mono text-xs font-bold text-slate-500">
                    {axisValues.map((value, index) => (
                        <div key={value} className="absolute right-0 -translate-y-1/2" style={{top: `${index * 12.5}%`}}>
                            {value}
                        </div>
                    ))}
                </div>
                <div>
                    <div className="relative flex h-[280px] items-end justify-around border-b-2 border-l-2 border-slate-700 px-8">
                        <div className="absolute inset-0 grid grid-rows-8">
                            {Array.from({length: 8}, (_, line) => (
                                <div key={line} className="border-t border-dashed border-slate-300 first:border-t-0" />
                            ))}
                        </div>
                        {data.categories.map(({label, count}, index) => (
                            <div key={label} className="relative z-10 flex h-full w-24 items-end justify-center">
                                <div
                                    className={`w-16 rounded-t-md border-x-2 border-t-2 ${
                                        revealBars
                                            ? `${categoryStyles[index].bar} border-slate-600`
                                            : 'h-full border-dashed border-slate-400 bg-white'
                                    }`}
                                    style={revealBars ? {height: `${(count / data.scale) * 12.5}%`} : undefined}
                                >
                                    {revealBars && revealCounts && (
                                        <div className="pt-2 text-center font-mono text-lg font-black text-slate-800">{count}</div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="flex justify-around px-8 pt-2">
                        {data.categories.map(({label}) => (
                            <div key={label} className="w-24 text-center text-sm font-bold text-slate-700">{label}</div>
                        ))}
                    </div>
                    <div className="mt-2 text-center text-xs font-bold uppercase tracking-wider text-slate-500">
                        Number of items — scale steps by {data.scale}
                    </div>
                </div>
            </div>

            {displayTask === 'read-category-count' && data.task === 'categorical-data' && (
                <div className="mt-5 flex items-center justify-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 font-mono text-2xl font-bold text-slate-700">
                    <span>{data.selectedCategory}</span><span>=</span>
                    <AnswerBox answer={isSolutionView ? data.answer : undefined} />
                </div>
            )}

            {data.task === 'find-total' && (
                <div className="mt-5 flex items-center justify-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 font-mono text-2xl font-bold text-slate-700">
                    <span>{data.categories[0].count}</span><span>+</span>
                    <span>{data.categories[1].count}</span><span>+</span>
                    <span>{data.categories[2].count}</span><span>=</span>
                    <AnswerBox answer={isSolutionView ? data.answer : undefined} />
                </div>
            )}

            {data.task === 'single-step-arithmetic' && (
                <div className="mt-5 flex items-center justify-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 font-mono text-2xl font-bold text-slate-700">
                    <span>{data.categories[data.operandIndices[0]].count}</span>
                    <span>{data.operation === 'addition' ? '+' : '−'}</span>
                    <span>{data.categories[data.operandIndices[1]].count}</span><span>=</span>
                    <AnswerBox answer={isSolutionView ? data.answer : undefined} />
                </div>
            )}

            {data.task === 'multi-step-arithmetic' && (
                <div className="mt-5 grid grid-cols-2 gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 font-mono text-xl font-bold text-slate-700">
                    <div className="flex items-center justify-center gap-2">
                        <span className="font-sans text-xs font-bold uppercase tracking-wide text-slate-500">Step 1</span>
                        <span>{data.categories[data.operandIndices[0]].count}</span><span>−</span>
                        <span>{data.categories[data.operandIndices[1]].count}</span><span>=</span>
                        <AnswerBox answer={isSolutionView ? data.intermediate : undefined} />
                    </div>
                    <div className="flex items-center justify-center gap-2">
                        <span className="font-sans text-xs font-bold uppercase tracking-wide text-slate-500">Step 2</span>
                        <span>{isSolutionView ? data.intermediate : 'Step 1'}</span><span>−</span>
                        <span>{data.categories[data.operandIndices[2]].count}</span><span>=</span>
                        <AnswerBox answer={isSolutionView ? data.answer : undefined} />
                    </div>
                </div>
            )}
        </div>
    );
};
