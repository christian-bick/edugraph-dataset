import {createRoot} from 'react-dom/client';
import {ViewRenderPayload} from '../../../../types/ml-engine.ts';
import {ViewValidationError} from '../../../helpers/validation.ts';
import {withConfig} from '../../withConfig.tsx';
import {categoryStyles, validateStatisticalGraph} from '../helpers.ts';
import {DataPictureGraphViewSchema} from './spec.ts';
import '../../../../tailwind.css';

interface CoreProps {
    payload: ViewRenderPayload<'data-picture-graph'>;
}

const DataPictureGraphCore = ({payload}: CoreProps) => {
    const {problem, isSolutionView} = payload;
    const data = problem.data;
    validateStatisticalGraph(data, 'data-picture-graph');
    if (data.operation !== undefined) {
        throw new ViewValidationError('data-picture-graph', 'Picture-graph drawing does not accept an arithmetic question.');
    }

    return (
        <div className="w-[680px] rounded-2xl bg-white p-8 font-sans shadow-[0_10px_30px_rgba(15,23,42,0.08)]">
            <div className="text-sm font-bold uppercase tracking-[0.16em] text-rose-700">Picture graph</div>
            <div className="mt-1 text-xl font-bold text-slate-800">
                {isSolutionView ? 'Completed picture graph' : 'Draw a picture graph for the data.'}
            </div>

            <div className="mt-5 grid grid-cols-3 gap-3">
                {data.categories.map(({label, count}, index) => (
                    <div key={label} className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-center">
                        <div className={`text-sm font-bold ${categoryStyles[index].text}`}>{label}</div>
                        <div className="mt-1 font-mono text-xl font-extrabold text-slate-800">{count}</div>
                    </div>
                ))}
            </div>

            <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-5">
                {data.categories.map(({label, count}, index) => (
                    <div key={label} className="grid min-h-16 grid-cols-[90px_1fr] items-center border-t border-slate-200 first:border-t-0">
                        <div className="font-bold text-slate-700">{label}</div>
                        <div className="flex min-h-11 items-center gap-3 rounded-lg border-2 border-dashed border-slate-300 bg-white px-4">
                            {isSolutionView && Array.from({length: count}, (_, marker) => (
                                <span key={marker} className={`size-6 ${categoryStyles[index].marker}`} />
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            <div className="mt-4 text-center text-sm font-bold text-slate-600">
                Each symbol = 1 item
            </div>
        </div>
    );
};

export const DataPictureGraph = withConfig(DataPictureGraphViewSchema, DataPictureGraphCore);

let root: ReturnType<typeof createRoot> | null = null;
window.renderView = (payload: ViewRenderPayload<'data-picture-graph'>) => {
    const container = document.getElementById('view');
    if (!container) return;
    if (!root) root = createRoot(container);
    root.render(<DataPictureGraph payload={payload} />);
};
