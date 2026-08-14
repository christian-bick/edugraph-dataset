import {Ability} from 'edugraph-ts';
import {createRoot} from 'react-dom/client';
import {ViewRenderPayload} from '../../../../types/ml-engine.ts';
import {ViewValidationError} from '../../../helpers/validation.ts';
import {withConfig} from '../../withConfig.tsx';
import {categoryStyles, graphQuestion, validateStatisticalGraph} from '../helpers.ts';
import {DataBarGraphViewConfig, DataBarGraphViewSchema} from './spec.ts';
import '../../../../tailwind.css';

interface CoreProps {
    config: DataBarGraphViewConfig;
    payload: ViewRenderPayload<'data-bar-graph'>;
}

const DataBarGraphCore = ({config, payload}: CoreProps) => {
    const {problem, isSolutionView} = payload;
    const data = problem.data;
    validateStatisticalGraph(data, 'data-bar-graph');

    const isDrawing = config.taskAbility === Ability.VisualArticulation;
    if (isDrawing !== (data.operation === undefined)) {
        throw new ViewValidationError('data-bar-graph', 'The task ability and arithmetic payload do not agree.');
    }
    const revealBars = !isDrawing || isSolutionView;
    const axisValues = Array.from({length: 9}, (_, value) => (8 - value) * data.scale);

    return (
        <div className="w-[700px] rounded-2xl bg-white p-8 font-sans shadow-[0_10px_30px_rgba(15,23,42,0.08)]">
            <div className="text-sm font-bold uppercase tracking-[0.16em] text-sky-700">Bar graph</div>
            <div className="mt-1 text-xl font-bold text-slate-800">
                {isDrawing
                    ? (isSolutionView ? 'Completed bar graph' : 'Draw a bar graph for the data.')
                    : graphQuestion(data)}
            </div>

            {isDrawing && (
                <div className="mt-4 flex justify-center gap-3">
                    {data.categories.map(({label, count}, index) => (
                        <div key={label} className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-bold text-slate-700">
                            <span className={categoryStyles[index].text}>{label}</span>: {count}
                        </div>
                    ))}
                </div>
            )}

            <div className="mt-5 grid grid-cols-[30px_1fr] gap-3">
                <div className="grid h-[280px] grid-rows-9 text-right font-mono text-xs font-bold text-slate-500">
                    {axisValues.map(value => <div key={value} className="-translate-y-2">{value}</div>)}
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
                                            : 'border-dashed border-slate-400 bg-white'
                                    }`}
                                    style={{height: revealBars ? `${(count / data.scale) * 12.5}%` : '100%'}}
                                >
                                    {revealBars && <div className="pt-2 text-center font-mono text-lg font-black text-slate-800">{count}</div>}
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="flex justify-around px-8 pt-2">
                        {data.categories.map(({label}) => <div key={label} className="w-24 text-center text-sm font-bold text-slate-700">{label}</div>)}
                    </div>
                    <div className="mt-2 text-center text-xs font-bold uppercase tracking-wider text-slate-500">Number of items - scale steps by {data.scale}</div>
                </div>
            </div>

            {!isDrawing && data.operation && data.operandIndices && (
                data.operandIndices.length === 3 ? (
                    <div className="mt-5 grid grid-cols-2 gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 font-mono text-xl font-bold text-slate-700">
                        <div className="flex items-center justify-center gap-2">
                            <span className="font-sans text-xs font-bold uppercase tracking-wide text-slate-500">Step 1</span>
                            <span>{data.categories[data.operandIndices[0]].count}</span>
                            <span>−</span>
                            <span>{data.categories[data.operandIndices[1]].count}</span>
                            <span>=</span>
                            <span className="inline-flex min-w-14 justify-center rounded-md border-2 border-slate-500 bg-white px-2 py-1 text-emerald-700">
                                {isSolutionView ? data.intermediate : ''}
                            </span>
                        </div>
                        <div className="flex items-center justify-center gap-2">
                            <span className="font-sans text-xs font-bold uppercase tracking-wide text-slate-500">Step 2</span>
                            <span>{isSolutionView ? data.intermediate : 'Step 1'}</span>
                            <span>−</span>
                            <span>{data.categories[data.operandIndices[2]].count}</span>
                            <span>=</span>
                            <span className="inline-flex min-w-14 justify-center rounded-md border-2 border-slate-500 bg-white px-2 py-1 text-emerald-700">
                                {isSolutionView ? data.answer : ''}
                            </span>
                        </div>
                    </div>
                ) : (
                    <div className="mt-5 flex items-center justify-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 font-mono text-2xl font-bold text-slate-700">
                        <span>{data.categories[data.operandIndices[0]].count}</span>
                        <span>{data.operation === 'addition' ? '+' : '−'}</span>
                        <span>{data.categories[data.operandIndices[1]].count}</span>
                        <span>=</span>
                        <span className="inline-flex min-w-16 justify-center rounded-md border-2 border-slate-500 bg-white px-3 py-1 text-emerald-700">
                            {isSolutionView ? data.answer : ''}
                        </span>
                    </div>
                )
            )}
        </div>
    );
};

export const DataBarGraph = withConfig(DataBarGraphViewSchema, DataBarGraphCore);

let root: ReturnType<typeof createRoot> | null = null;
window.renderView = (payload: ViewRenderPayload<'data-bar-graph'>) => {
    const container = document.getElementById('view');
    if (!container) return;
    if (!root) root = createRoot(container);
    root.render(<DataBarGraph payload={payload} />);
};
