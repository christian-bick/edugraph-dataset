import {AbstractProblem, RenderPayload} from '../../../types/ml-engine.ts';
import {StatisticalGraphProblem} from '../../../types/problems.ts';
import {ViewValidationError} from '../../helpers/validation.ts';
import {categoryStyles, validateStatisticalGraph} from './helpers.ts';
import {
    resolveStatisticalGraphTask,
    StatisticalGraphViewMode
} from './statistical-graph-presentation.ts';

interface PictureGraphViewProps {
    mode: StatisticalGraphViewMode;
    payload: RenderPayload<AbstractProblem<StatisticalGraphProblem>>;
    viewId: string;
}

export const PictureGraphView = ({mode, payload, viewId}: PictureGraphViewProps) => {
    const {problem, isSolutionView} = payload;
    const data = problem.data;
    validateStatisticalGraph(data, viewId);

    const displayTask = resolveStatisticalGraphTask(data, mode);
    if (displayTask === null) {
        throw new ViewValidationError(
            viewId,
            `The ${mode} picture-graph view does not support the generated statistical task.`
        );
    }
    if (data.task === 'single-step-arithmetic' || data.task === 'multi-step-arithmetic') {
        throw new ViewValidationError(viewId, 'This picture-graph layout cannot render the requested arithmetic direction.');
    }

    const showMarkers = mode !== 'construction' && mode !== 'classification' || isSolutionView;
    const heading = displayTask === 'construct'
        ? (isSolutionView ? 'Completed picture graph' : 'Draw a picture graph for the data.')
        : data.task === 'organize'
            ? (isSolutionView ? 'Grouped picture graph' : data.prompt)
            : displayTask === 'read-category-count' && data.task === 'categorical-data'
                ? `How many ${data.selectedCategory.toLowerCase()} are shown?`
                : data.prompt;

    return (
        <div className="w-[680px] rounded-2xl bg-white p-8 font-sans shadow-[0_10px_30px_rgba(15,23,42,0.08)]">
            <div className="text-sm font-bold uppercase tracking-[0.16em] text-rose-700">Picture graph</div>
            <div className="mt-1 text-xl font-bold text-slate-800">{heading}</div>

            {displayTask === 'construct' && (
                <div className="mt-5 grid grid-cols-3 gap-3">
                    {data.categories.map(({label, count}, index) => (
                        <div key={label} className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-center">
                            <div className={`text-sm font-bold ${categoryStyles[index].text}`}>{label}</div>
                            <div className="mt-1 font-mono text-xl font-extrabold text-slate-800">{count}</div>
                        </div>
                    ))}
                </div>
            )}

            {data.task === 'organize' && (
                <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <div className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-500">Shuffled observations</div>
                    <div className="flex flex-wrap justify-center gap-2">
                        {data.rawObservations.map((label, observationIndex) => {
                            const categoryIndex = data.categories.findIndex(category => category.label === label);
                            return (
                                <div key={`${label}-${observationIndex}`} className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm font-bold text-slate-700">
                                    <span className={`size-3 ${categoryStyles[categoryIndex].marker}`} />
                                    {label}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-5">
                {data.categories.map(({label, count}, index) => (
                    <div key={label} className="grid min-h-16 grid-cols-[90px_1fr] items-center border-t border-slate-200 first:border-t-0">
                        <div className="font-bold text-slate-700">{label}</div>
                        <div aria-label={`${label} picture row`} className="flex min-h-11 items-center gap-3 rounded-lg border-2 border-dashed border-slate-300 bg-white px-4">
                            {showMarkers && Array.from({length: count / data.scale}, (_, marker) => (
                                <span key={marker} data-picture-marker="true" className={`size-6 ${categoryStyles[index].marker}`} />
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            <div className="mt-4 text-center text-sm font-bold text-slate-600">
                Each symbol = {data.scale} {data.scale === 1 ? 'item' : 'items'}
            </div>

            {displayTask === 'read-category-count' && data.task === 'categorical-data' && (
                <div className={`mx-auto mt-5 flex min-h-16 w-[280px] items-center justify-center rounded-xl border-2 px-4 text-center ${isSolutionView ? 'border-emerald-500 bg-emerald-50 text-emerald-800' : 'border-dashed border-slate-300 bg-white text-slate-500'}`}>
                    <span className="mr-3 text-sm font-bold">{data.selectedCategory} count:</span>
                    <span aria-label="Category count response" data-response="category-count" className="min-w-16 font-mono text-2xl font-black">{isSolutionView ? data.answer : '____'}</span>
                </div>
            )}

            {data.task === 'find-total' && (
                <div className="mt-5 flex items-center justify-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 font-mono text-2xl font-bold text-slate-700">
                    {data.operandIndices.map((categoryIndex, index) => (
                        <span key={categoryIndex} className="contents">
                            {index > 0 && <span>+</span>}
                            <span>{data.categories[categoryIndex].count}</span>
                        </span>
                    ))}
                    <span>=</span>
                    <span aria-label="Total response" data-response="total" className={`inline-flex min-w-16 justify-center rounded-md border-2 bg-white px-3 py-1 ${isSolutionView ? 'border-emerald-500 text-emerald-700' : 'border-slate-400 text-slate-400'}`}>
                        {isSolutionView ? data.answer : ''}
                    </span>
                </div>
            )}
        </div>
    );
};
